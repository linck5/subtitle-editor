import { Controller, Post, HttpCode, HttpStatus, Param, Res, Req, Get } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User } from '../user/user.schema';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }


  @Get('/user/:user_id')
  async GetById( @Param('user_id') user_id, @Res() res) {

      return await this.userService.GetById(user_id).then(user => {
          if(user){
            return res.json(user)
          }
          else{
            return res.status(HttpStatus.BAD_REQUEST).json({
              code: 'noSuchId',
              message: 'User id not found'
            });
          }
      });
  }

}