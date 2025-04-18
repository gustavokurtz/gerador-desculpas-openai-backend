// src/openai/openai.service.ts
import { Injectable, Logger } from '@nestjs/common'; // Importe o Logger para mensagens
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name); // Logger opcional, mas útil

  constructor(private configService: ConfigService) {
    // 1. Buscar a chave de API do .env usando o ConfigService
    const apiKey = this.configService.get<string>('OPENAI_API_KEY'); // Use o mesmo nome da variável no .env

    // 2. Verificar se a chave foi encontrada (MUITO IMPORTANTE!)
    if (!apiKey) {
      this.logger.error('Chave da API OpenAI (OPENAI_API_KEY) não encontrada nas variáveis de ambiente!');
      // Você pode lançar um erro para impedir que a aplicação inicie sem a chave
      throw new Error('Configuração crítica faltando: OPENAI_API_KEY não está definida no ambiente.');
    }

    // 3. Inicializar o OpenAI com a chave buscada do .env
    this.openai = new OpenAI({
      apiKey: apiKey, // <-- Use a variável 'apiKey' aqui
    });

    this.logger.log('Serviço OpenAI inicializado com sucesso.'); // Mensagem de confirmação
  }

  // O restante do seu serviço (buildPrompt, chatWithExcuseBot) permanece igual...
  private buildPrompt(userProblem: string): string {
    return `
Você é um desenvolvedor sênior especializado em criar desculpas técnicas convincentes.

Sua missão é receber uma descrição do problema e responder com uma desculpa técnica que pareça legítima, mas com um toque de humor, sarcasmo e criatividade.

Regras:
- A desculpa precisa parecer plausível para um leigo.
- Use termos técnicos de forma confiante.
- Seja sutilmente sarcástico e criativo.
- Evite repetir respostas.

Exemplos:

Problema: "O deploy falhou"
Resposta: "Foi um conflito inesperado com o cache do Cloudflare combinado com um rollback automático mal configurado. Já estou ajustando o YAML da pipeline."

Problema: "O site está fora do ar"
Resposta: "Ah, isso é clássico. O DNS ainda está propagando. Pode levar até 48 horas, sabe como é..."

Problema: "${userProblem}"
Resposta:
    `;
  }

  async chatWithExcuseBot(userProblem: string): Promise<string> {
    const prompt = this.buildPrompt(userProblem);

    try { // Adicionar try/catch para melhor tratamento de erro da API
        const res = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
        });

        // Usar optional chaining para mais segurança ao acessar a resposta
        const respostaFinal = res.choices[0]?.message?.content;

        if (!respostaFinal) {
            this.logger.error('Resposta inesperada ou vazia da API OpenAI.', res);
            throw new Error('Não foi possível obter uma resposta válida da IA.');
        }

        // Usar trim() para remover espaços em branco extras no início/fim
        return respostaFinal.trim();

    } catch (error) {
        this.logger.error(`Erro ao chamar a API OpenAI: ${error.message}`, error.stack);
        // Relançar o erro ou retornar uma mensagem padrão
        throw new Error('Falha ao comunicar com o serviço de IA.');
    }
  }
}