import sys
import os
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI # Ou a importação correta para sua versão
from dotenv import load_dotenv
import argparse

# Função para tratar erros e sair
def handle_error(message):
    print(f"PYTHON_ERROR: {message}", file=sys.stderr)
    sys.exit(1)

def main(problem_description, api_key, model_name):
    if not api_key:
        handle_error("OpenAI API Key not provided via environment variable.")
    if not problem_description:
        handle_error("Problem description not provided via arguments.")

    try:
        llm = ChatOpenAI(
            openai_api_key=api_key,
            model_name=model_name,
            temperature=0.9
        )

        # Agente (em Português)
        excuse_generator = Agent(
            role='Especialista Sênior em Desculpas Técnicas',
            goal=(
                f'Criar uma desculpa técnica convincente e levemente humorística '
                f'para o problema: "{problem_description}". '
                f'A resposta DEVE ser em Português do Brasil.'
            ),
            backstory=(
                'Um mestre em entrelaçar jargões técnicos em explicações plausíveis '
                'para falhas, com um toque sarcástico. Você segue as regras à risca '
                'e responde exclusivamente em Português do Brasil.'
            ),
            verbose=False,
            allow_delegation=False,
            llm=llm
        )

        # Tarefa (em Português)
        generate_excuse_task = Task(
            description=(
                f'Analise o problema do usuário "{problem_description}" e gere uma desculpa técnica adequada. '
                'Siga estas Regras Rigorosamente:\n'
                '- A desculpa deve parecer plausível para uma pessoa não técnica.\n'
                '- Use termos técnicos com confiança (ex: DNS, cache, latência, pipeline, microserviço, etc.).\n'
                '- Seja sutilmente sarcástico e criativo na formulação.\n'
                '- Evite respostas genéricas ou repetitivas.\n'
                '- A resposta final DEVE ser exclusivamente em Português do Brasil.\n'
                '- Retorne APENAS a string da desculpa, sem nenhuma introdução, saudação ou explicação adicional.'
            ),
            expected_output=(
                 'Uma única string contendo a desculpa técnica criativa e bem-humorada, '
                 'formulada em Português do Brasil.'
            ),
            agent=excuse_generator
        )

        # Crew
        excuse_crew = Crew(
            agents=[excuse_generator],
            tasks=[generate_excuse_task],
            verbose=0,
            process=Process.sequential # Processo sequencial padrão
        )

        # Executar
        crew_output = excuse_crew.kickoff() # Renomeado para clareza

        # --- CORREÇÃO APLICADA AQUI ---
        # 5. Imprimir o resultado para stdout
        if crew_output:
            # Converte o objeto CrewOutput para string ANTES de usar strip()
            final_result_string = str(crew_output)
            print(final_result_string.strip())
        else:
            # Se kickoff retornar None ou algo avaliado como False
            handle_error("CrewAI retornou um resultado vazio ou inesperado.")
        # --- FIM DA CORREÇÃO ---

    except Exception as e:
         # Incluir o tipo de erro na mensagem ajuda na depuração
        handle_error(f"Error during CrewAI execution: {type(e).__name__} - {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Gera uma desculpa técnica usando CrewAI em Português.')
    parser.add_argument('problem', type=str, help='A descrição do problema que precisa de uma desculpa.')
    args = parser.parse_args()

    api_key_from_env = os.getenv('OPENAI_API_KEY_FOR_PYTHON')
    model_name_from_env = os.getenv('OPENAI_MODEL_FOR_PYTHON', 'gpt-4o')

    main(args.problem, api_key_from_env, model_name_from_env)