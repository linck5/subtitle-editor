import { Controller, Post, HttpStatus, Param, Query, Get, Patch, Body, Delete,
  HttpException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDTO, UpdateUserDTO, ListUserDTO, userOrderByParams,
GetUserByNameDTO } from './user.dtos';
import { OrderByPipe } from '../common/orderBy/orderBy.pipe';


@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }


  @Get('/users')
  async List( @Query(new OrderByPipe(userOrderByParams)) query:ListUserDTO ) {
    return await this.userService.List(query)
    .catch(err => {
      throw new HttpException({
        error: err
      }, HttpStatus.BAD_REQUEST);
    });
  }

  @Get('/user/:user_id')
  async GetById( @Param('user_id') user_id) {
    return await this.userService.GetById(user_id)
    .catch(err => {
      throw new HttpException({
        error: err
      }, HttpStatus.BAD_REQUEST);
    });
  }

  @Get('/user')
  async GetByName( @Query() query:GetUserByNameDTO) {
    return await this.userService.FindByName(query.username)
    .catch(err => {
      throw new HttpException({
        error: err
      }, HttpStatus.BAD_REQUEST);
    });
  }

  @Post('/users')
  async Create( @Body() addUserDTO:CreateUserDTO) {
    return await this.userService.Create(addUserDTO)
    .catch(err => {
      throw new HttpException({
        error: err
      }, HttpStatus.BAD_REQUEST);
    });
  }

  @Patch('/user/:user_id')
  async Update( @Param('user_id') user_id, @Body() updateUserDTO:UpdateUserDTO) {
    return await this.userService.Update(user_id, updateUserDTO)
    .catch(err => {
      throw new HttpException({
        error: err
      }, HttpStatus.BAD_REQUEST);
    });
  }

  @Delete('/user/:user_id')
  async Delete( @Param('user_id') user_id) {
    return await this.userService.Delete(user_id)
    .catch(err => {
      throw new HttpException({
        error: err
      }, HttpStatus.BAD_REQUEST);
    });
  }

}
