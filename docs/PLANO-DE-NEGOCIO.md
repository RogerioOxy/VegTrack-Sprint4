# Plano de negócio do VegTrack

Proposta acadêmica da Sprint 4. As referências numeradas estão ao fim do documento. Preços, volumes, metas e horas são premissas, sem cotação ou contrato com a Motiva.

## Problema e proposta de valor

Segundo publicação institucional de 13/11/2025, as concessionárias da Motiva administram 4.475 km de vias em seis estados [1]. O Rodoanel Oeste tem 30 km [2], escala proposta para um piloto. A base acadêmica usa trechos fictícios entre KM 23 e 67 e não representa o cadastro dessa concessão.

A ARTESP registrou 3.067 focos de incêndio nas rodovias estaduais concedidas entre janeiro e maio de 2024, ante 1.224 no mesmo período de 2023 [3]. A ação humana está entre as principais causas apontadas [3]. Isso contextualiza o acompanhamento das margens; não demonstra que roçada ou um aplicativo impeçam incêndios.

O VegTrack organiza vistoria, OS e comprovação do serviço. O técnico registra altura, foto e localização; o supervisor acompanha pendências; o gestor exporta o histórico. O app distingue captura do dispositivo de conteúdo demonstrativo. A proposta comercial exige servidor, autenticação e integração operacional ainda ausentes no protótipo.

A Motiva já implanta no Rodoanel cadastro por satélite e monitoramento de áreas verdes com IA, incluindo apoio à seleção de equipamento e geração de boletins e ordens de trabalho [5], publicação de 17/12/2025. O VegTrack se posiciona como camada de execução e evidência de campo complementar a esse processo. A integração proposta receberia identificadores de trecho e ordem e devolveria conclusão e anexos. Não foi implementada nem acordada com a empresa.

## Público e personas

| Persona | Necessidade atendida |
|---|---|
| Carlos, o Cadú, supervisor | Priorizar vistorias e acompanhar execução sem reunir planilhas separadas. |
| Técnico de campo, persona proposta | Registrar evidência no local e retomar o trabalho com conectividade limitada. |
| Gestor do contrato, persona proposta | Conferir conclusão, pendências e histórico para prestação de contas. |

O comprador proposto é a concessionária ou a área responsável pelo contrato de conservação. Equipes próprias e prestadoras seriam usuárias. Essa hipótese precisa de entrevistas.

## Receita e contratação

| Modelo | Premissa comercial e conta | Avaliação |
|---|---|---|
| SaaS por km, escolhido | Premissa: R$ 40/km/mês; 30 km × R$ 40 = R$ 1.200/mês. | Cobrança ligada à extensão contratada, sem nova licença a cada troca de técnico. |
| Assinatura por usuário | Premissa: 20 usuários × R$ 60 = R$ 1.200/mês. | Simples, mas pode desestimular inclusão de técnicos eventuais. |
| Serviço gerenciado | Premissa: 40 h/mês × R$ 120 = R$ 4.800/mês. | Acompanhamento humano, com maior dependência de equipe e outro escopo. |

A implantação inicial teria como premissa 40 h × R$ 120/h = R$ 4.800, para configurar trechos, importar cadastro e treinar a equipe. Não inclui desenvolver todas as integrações de produção. Prazo e critérios do piloto seriam negociados, sem assumir contratação dos 4.475 km.

## Custos mensais e viabilidade

Cenário proposto: 20 usuários, 5 fotos por usuário por dia, 22 dias/mês, 1,5 MB por foto e retenção de 12 meses. São 2.200 fotos e 3,3 GB novos por mês, ou 39,6 GB no fim do período, em unidades decimais. Infraestrutura é estimativa, sem preço verificado de provedor.

| Despesa | Premissa e conta mensal |
|---|---|
| API, banco e monitoramento | Premissa: 3 componentes × R$ 150 = R$ 450. |
| Fotos, backup e tráfego | Premissa: 39,6 GB × R$ 0,50 × 2 cópias + R$ 45,40 de tráfego = R$ 85. |
| Suporte | Premissa: 8 h × R$ 90 = R$ 720. |
| Manutenção do app | Premissa: 20 h × R$ 120 = R$ 2.400. |
| Publicação nas lojas | Premissa: reserva anual de R$ 600 ÷ 12 = R$ 50. Não é tarifa oficial; o APK acadêmico tem distribuição direta. |
| Total | Premissa: R$ 450 + R$ 85 + R$ 720 + R$ 2.400 + R$ 50 = R$ 3.705/mês. |

O piloto de 30 km teria déficit mensal estimado, como premissa: R$ 3.705 - R$ 1.200 = R$ 2.505. Exige orçamento de experimentação. Sob os mesmos custos, o equilíbrio seria a premissa R$ 3.705 ÷ R$ 40 = 92,625 km, arredondados para 93 km. É um limite inferior: tributos, vendas, desenvolvimento inicial, segurança e aumento do suporte precisam de orçamento. A implantação é pontual e não resolve o déficit recorrente.

## Diferenciais, riscos e impacto esperado

O diferencial proposto é ligar medição, histórico, OS e evidência, indicando a origem dos sensores e mantendo consulta por perfil. Hoje a fila offline é local e a sincronização é simulada. Autenticação de produção, conflitos entre aparelhos, regras ambientais homologadas e integração com o sistema da Motiva são condições para vender essa proposta.

Como referência de ordem de grandeza, a reprodução das composições SICRO para SP, abril/2026, informa R$ 2.631,55/ha para roçada manual, R$ 1.005,01/ha com roçadeira articulada e R$ 593,41/ha com roçadeira de arraste [4]. Não são orçamento da Motiva. Mandar a equipe ao lugar errado ou escolher um método inadequado pode consumir recursos; os valores mostram por que conferir o trecho importa, sem provar uma economia.

Os riscos incluem GPS impreciso, evidência inadequada, perda do aparelho, exposição de imagens, baixa adesão e incompatibilidade com sistemas existentes. O piloto deve prever revisão pelo supervisor, treinamento, política de retenção e proteção dos dados. O produto não substitui avaliação ambiental nem determina conformidade com a ARTESP.

O impacto esperado é reduzir retrabalho e melhorar a conferência dos serviços, com benefício indireto à conservação das margens. A avaliação proposta compara tempo entre vistoria e conclusão, revisitas por erro de trecho e percentual de OS com evidência completa antes e durante o piloto. Metas serão premissas negociadas após medir a linha de base. Não há resultado de campo comprovado.

## Referências

[1] [Motiva, extensão das vias, 13/11/2025](https://rodovias.motiva.com.br/riosp/noticias/2025/novembro/motiva--sua-gentileza-pode-salvar-vidas/).

[2] Concessionária do Rodoanel Oeste S.A. Demonstrações Financeiras do exercício de 2012, Relatório da Administração. [Documento primário](https://rodovias.motiva.com.br/content/dam/conteudo-multicanal/rodovias/conteudo/pt/relacoes-com-investidores/rodoanel/DFP%202012.pdf).

[3] [Governo de SP, focos e causas de incêndios, 04/07/2024](https://semil.sp.gov.br/2024/07/motoristas-devem-ficar-atentos-a-sinais-de-incendio-em-estradas-neste-feriado/).

[4] Reprodução SICRO, fonte secundária: [manual](https://orcamentor.com/sicro/composicoes/4915740/), [articulada](https://orcamentor.com/sicro/composicoes/4915775/) e [arraste](https://orcamentor.com/sicro/composicoes/4915742/).

[5] [Motiva, IA no Rodoanel, 17/12/2025](https://rodovias.motiva.com.br/rodoanel/noticias/2025/dezembro/rodoanel-utiliza-inteligencia-artificial-para-elevar-padrao-de-m/).
