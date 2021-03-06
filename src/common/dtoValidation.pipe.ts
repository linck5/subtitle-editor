import { PipeTransform, Injectable, ArgumentMetadata, HttpException,
  HttpStatus } from '@nestjs/common';

import { validate, ValidatorOptions, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';


import { CreateChangeDTO } from '../change/change.dtos';
import { CreateAssChangeDTO } from '../change/ass/change.dtos';


@Injectable()
export class DTOValidationPipe implements PipeTransform<any> {

  options:ValidatorOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: true
  }

  async transform(dto, {metatype, type}: ArgumentMetadata) {

    if(type == 'param') return dto;

    if(metatype == CreateChangeDTO){
      if(dto.subformat){
        switch(dto.subformat){
          case "ASS": metatype = CreateAssChangeDTO; break;
          default: throw new HttpException({
            code: 'validationError',
            message: `Invalid value for "subFormat": ${dto.subformat}`
          }, HttpStatus.BAD_REQUEST);
        }
      }
    }

    const dtoClass = plainToClass(metatype, dto);

    const errors:ValidationError[] = await validate(dtoClass, this.options);

    if(errors.length > 0){
      throw new HttpException({
        code: 'validationError',
        message: findFirstConstraint(errors[0])
      }, HttpStatus.BAD_REQUEST);
    }

    return dto;
  }
}


function findFirstConstraint(obj) {

  if (obj.constraints)
    return Object.values(obj.constraints)[0];

  for (const value of Object.values(obj)){

    if (typeof value == 'object') {
      const found = findFirstConstraint(value);
      if (found) return found;
    }
  }

}
