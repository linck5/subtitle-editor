import { Document, Schema } from 'mongoose';
import { Collaborator, CollaboratorSchema } from './collaborator/collaborator.schema'
var mongoosePaginate = require('mongoose-paginate');

export interface Branch extends Document {
  collaborators: Collaborator[];
  status: string;
  deleted: boolean;
  source_id: string; //the source branch of a merged branch is the branch that merged into the mainline
  baseCommit_ids: Schema.Types.ObjectId[];
}

export const BranchSchema = new Schema({

  collaborators: {
    type: [CollaboratorSchema],
  },
  status: {
    type: String,
    enum: ["UNMODIFIED", "IN_PROGRESS", "FINISHED", "APPROVED", "MERGED", "ROOT"],
    default: "UNMODIFIED"
  },
  deleted: {
    type: Boolean,
    default: false
  },
  source_id: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  baseCommit_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Commit'
  }]
});
BranchSchema.plugin(mongoosePaginate);
