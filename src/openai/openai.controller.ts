// src/openai/openai.controller.ts
import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common'; // Adicione imports
import { OpenaiService } from './openai.service';
import { ChatDto } from './dto/openai.dto'; // Importe o DTO

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true })) // Adicione para validação e transformação
  async chatWithExcuseBot(@Body() chatDto: ChatDto): Promise<string> { // Use o DTO
    // Acesse o problema através do DTO
    return await this.openaiService.chatWithExcuseBot(chatDto.userProblem);
  }
}