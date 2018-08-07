import { Model, PaginateModel, PaginateResult, PaginateOptions,
  ModelUpdateOptions, Schema } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Branch } from './branch.schema';
import { Tree } from '../tree/tree.schema';
import { User } from '../user/user.schema';
import { Commit } from '../commit/commit.schema';
import { Change } from '../change/change.schema';
import { Rebase } from './rebasing/rebase.schema';
import { RebaseService } from './rebasing/rebase.service';
import { Collaborator } from './collaborator/collaborator.schema';
import { CreateBranchDTO, UpdateBranchDTO, ListBranchDTO } from './branch.dtos';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationService } from '../common/pagination.service';

@Injectable()
// tslint:disable-next-line:component-class-suffix
export class BranchService {

    constructor(
      @InjectModel('Branch') private readonly branchModel: Model<Branch>,
      @InjectModel('Branch') private readonly paginateBranchModel: PaginateModel<Branch>,
      @InjectModel('Tree') private readonly treeModel: Model<Tree>,
      @InjectModel('Commit') private readonly commitModel: Model<Commit>,
      @InjectModel('Change') private readonly changeModel: Model<Change>,
      @InjectModel('User') private readonly userModel: Model<User>,
      @InjectModel('Collaborator') private readonly collaboratorModel: Model<Collaborator>,
      private readonly paginationService: PaginationService,
      private readonly rebaseService: RebaseService
    ) { }


    async Create(dto:CreateBranchDTO): Promise<Branch> {


      const Tree:Tree = await this.treeModel.findById(dto.tree_id);
      const Creator:User = await this.userModel.findById(dto.creator_id);

      // create the collaborator document for the creator
      const CreatorAsCollaborator = new this.collaboratorModel({
        user_id: Creator._id,
        creator: true,
        admin: true
      });


      // any new branch is created on top of the mainline,
      // so the base mainline index is the last index of the mainline
      // in the current state of this branch's creation
      const mainlineBaseIndex:number = Tree.mainlineLength - 1;

      // create the branch itself
      const NewBranch = new this.branchModel({
        collaborators: [CreatorAsCollaborator],
        status: "UNMODIFIED",
        deleted: false,
        tree_id: dto.tree_id,
        mlBaseIndex: mainlineBaseIndex
      });

      // put a reference to the branch in the user
      Creator.branch_ids.push(NewBranch._id);
      await Creator.save();

      await NewBranch.save();

      return NewBranch;
    }

    async CreateRebasedBranch(tree:Tree, rebase:Rebase): Promise<Branch>{

      const mainlineBaseIndex:number = tree.mainlineLength - 1;

      // create the branch itself
      const rebasedBranch = new this.branchModel({
        status: "REBASED",
        deleted: false,
        tree_id: tree._id,
        mlBaseIndex: mainlineBaseIndex,
        isInMainline: true
      });
      await rebasedBranch.save();

      const rebasedCommit = new this.commitModel({
        description: "rebase",
        done: true,
        branch_id: rebasedBranch._id
      });
      await rebasedCommit.save();

      let rebasedChanges:Change[] = [];
      for(const change of rebase.rebaseData){
        const rebasedChange = new this.changeModel(change);
        rebasedChange.branch_id = rebasedBranch._id;
        rebasedChange.commit_id = rebasedCommit._id;
        rebasedChanges.push(rebasedChange);
      }

      await this.changeModel.insertMany(rebasedChanges);


      //this branch is being added to the mainline so its necessary
      //to update the mainline length on the tree doc
      tree.mainlineLength++;
      await tree.save();

      return rebasedBranch;


    }



    async Update(id, updateDto: UpdateBranchDTO): Promise<Branch | ApproveResponse> {
      const options:ModelUpdateOptions = {
        new: true, // true to return the modified document rather than the original
        runValidators: true
      }

      const branch:Branch = await this.branchModel.findById(id);

      if(updateDto.status == "APPROVED"){

        if(updateDto.resolvedRebase){

          const resolvedRebase:Rebase = await this.rebaseService.Apply(updateDto.resolvedRebase);

          return await this.Approve(branch, resolvedRebase);
        }
        else{
          return await this.Approve(branch);
        }

      }
      else{
        const updatedBranch:Branch = await branch.update(updateDto);

        return updatedBranch;
      }



    }

    async Approve(branch:Branch, resolvedRebase?:Rebase): Promise<ApproveResponse>{

      let tree:Tree = await this.treeModel.findById(branch.tree_id);

      const pendingRebase:Rebase =
        await this.rebaseService.CheckForAPendingRebase(tree);

      if(pendingRebase){
        if(pendingRebase._id == resolvedRebase._id){
          const rebasedBranch:Branch = await this.CreateRebasedBranch(tree, resolvedRebase);

          return {
            responseCode: 5,
            message: "Approved successfuly and rebased with given rebase data",
            approvedBranch: branch,
            rebasedBranch: rebasedBranch,
            rebase: resolvedRebase
          }
        }
        else{
          return {
            responseCode: 4,
            message: "Not approved, there is a pending rebase",
            pendingRebase: pendingRebase
          }
        }
      }
      //check if the branch is based on the mainline leaf branch
      if(branch.mlBaseIndex == tree.mainlineLength - 1){
        branch.status = "APPROVED";
        branch.isInMainline = true;
        await branch.save();
        tree.mainlineLength++;
        await tree.save();

        return {
          responseCode: 1,
          message: "Approved successfuly",
          approvedBranch: branch
        }

      }
      //if not, a rebase is required
      else{
        let rebase:Rebase = await this.rebaseService.Create(tree, branch);

        if(rebase.conflictsStatus == "PENDING"){
          return {
            responseCode: 3,
            message: "Not approved, solving rebase conflicts is required",
            rebase: rebase
          }
        }
        else{
          const rebasedBranch = await this.CreateRebasedBranch(tree, rebase);

          return {
            responseCode: 2,
            message: "Approved successfuly and rebased",
            approvedBranch: branch,
            rebasedBranch: rebasedBranch,
            rebase: rebase
          }
        }


      }
    }

    async Delete(id): Promise<Branch> {
      return await this.branchModel.findByIdAndRemove(id);
    }

    async GetById(id): Promise<Branch> {
      return await this.branchModel.findById(id);
    }


    async List(dto:ListBranchDTO): Promise<PaginateResult<Branch>> {

      let query:any = {};

      const options = this.paginationService.PaginateOptionsFromDto(dto);

      return await this.paginateBranchModel.paginate(query, options);

    }

}

interface ApproveResponse {

  //response codes:
  //1 - approved successfuly
  //2 - approved successfuly and rebased
  //3 - not approved, solving rebase conflicts is required
  //4 - not approved, there is a pending rebase
  //5 - approved successfuly and rebased with given rebase data
  responseCode: 1 | 2 | 3 | 4 | 5;
  message: string;
  approvedBranch?: Branch;
  rebasedBranch?: Branch;
  rebase?: Rebase;
  pendingRebase?: Rebase;
}
