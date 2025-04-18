import { IsString, IsNotEmpty } from 'class-validator'; 

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  userProblem: string;
}