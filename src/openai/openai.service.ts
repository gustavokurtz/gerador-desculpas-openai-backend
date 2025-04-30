// src/openai/openai.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process'; // Importar spawn
import * as path from 'path'; // Importar path para lidar com caminhos de arquivo

// REMOVA a importação do OpenAI se você não for mais usá-lo diretamente neste serviço
// import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  // REMOVA a instância do OpenAI se não for mais usada diretamente
  // private openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);
  private readonly apiKey: string; // Armazenar a chave para passar ao Python
  private readonly modelName = 'gpt-4o'; // Modelo a ser usado pelo Python (pode vir do config também)
  private readonly pythonExecutable: string; // Caminho para o executável Python

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.pythonExecutable = this.configService.get<string>('PYTHON_EXECUTABLE_PATH', 'python3'); // Default 'python3', pode configurar no .env

    if (!this.apiKey) {
      this.logger.error('Chave da API OpenAI (OPENAI_API_KEY) não encontrada!');
      throw new Error('Configuração crítica faltando: OPENAI_API_KEY não definida.');
    }

    // NÃO inicializamos mais o cliente OpenAI aqui diretamente
    this.logger.log(`Serviço configurado para usar Python em: ${this.pythonExecutable}`);
  }

  // REMOVA o método buildPrompt se a lógica do prompt agora está no Python/CrewAI
  /*
  private buildPrompt(userProblem: string): string {
    // ... (código antigo)
  }
  */

  async chatWithExcuseBot(userProblem: string): Promise<string> {
    this.logger.log(`Iniciando processo filho Python para gerar desculpa para: "${userProblem}"`);

    // Caminho para o script Python (ajuste se necessário)
    // __dirname geralmente aponta para a pasta 'dist' após a compilação,
    // então subir dois níveis pode levar à raiz do projeto. Teste isso!
    // Alternativamente, use um caminho relativo à raiz do projeto configurado.
    // const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'crew_excuse_generator.py');
    // Ou um caminho mais direto se souber a estrutura final:
    const scriptPath = path.resolve('./scripts/crew_excuse_generator.py');

    this.logger.debug(`Caminho do script Python: ${scriptPath}`);
    this.logger.debug(`Executável Python: ${this.pythonExecutable}`);

    // Usaremos uma Promise para lidar com o processo assíncrono do spawn
    return new Promise((resolve, reject) => {
      let scriptOutput = '';
      let scriptError = '';

      // Variáveis de ambiente para o processo filho Python
      const env = {
        ...process.env, // Herda o ambiente atual (importante para PATH, etc.)
        OPENAI_API_KEY_FOR_PYTHON: this.apiKey, // Passa a chave de API
        OPENAI_MODEL_FOR_PYTHON: this.modelName, // Passa o nome do modelo
        // PYTHONUNBUFFERED: '1' // Pode ser útil para garantir que a saída não seja bufferizada
      };

      // Spawn o processo Python
      // Passa o 'userProblem' como argumento de linha de comando
      const pythonProcess = spawn(this.pythonExecutable, [scriptPath, userProblem], { env });

      // Capturar saída padrão (stdout) do script Python
      pythonProcess.stdout.on('data', (data) => {
        const outputChunk = data.toString();
        this.logger.debug(`[Python STDOUT]: ${outputChunk}`);
        scriptOutput += outputChunk;
      });

      // Capturar saída de erro (stderr) do script Python
      pythonProcess.stderr.on('data', (data) => {
        const errorChunk = data.toString();
        this.logger.error(`[Python STDERR]: ${errorChunk}`);
        scriptError += errorChunk; // Acumula mensagens de erro
      });

      // Lidar com erros no próprio processo spawn (ex: Python não encontrado)
      pythonProcess.on('error', (error) => {
        this.logger.error(`Falha ao iniciar o processo filho Python: ${error.message}`, error.stack);
        reject(new InternalServerErrorException(`Falha ao executar o script Python: ${error.message}`));
      });

      // Lidar com o fechamento do processo Python
      pythonProcess.on('close', (code) => {
        this.logger.log(`Processo filho Python finalizado com código: ${code}`);

        if (code === 0) {
          // Sucesso: Verificar se houve erro impresso em stderr antes de resolver
           if (scriptError.includes("PYTHON_ERROR:")) {
             this.logger.error(`Erro reportado pelo script Python mesmo com código 0: ${scriptError}`);
             reject(new InternalServerErrorException(`Erro no script Python: ${scriptError.replace("PYTHON_ERROR:", "").trim()}`));
          } else if (!scriptOutput.trim()) {
             this.logger.error('Script Python finalizou com sucesso, mas sem saída (stdout).');
            reject(new InternalServerErrorException('O script de IA não retornou uma resposta.'));
          } else {
            resolve(scriptOutput.trim()); // Retorna a saída limpa
          }
        } else {
          // Erro: O script Python terminou com um código de erro
          this.logger.error(`Script Python terminou com erro (código ${code}). Saída de erro: ${scriptError}`);
          reject(new InternalServerErrorException(`O script Python falhou (código ${code}). Detalhes: ${scriptError || 'Nenhuma saída de erro específica.'}`));
        }
      });
    });
  }
}