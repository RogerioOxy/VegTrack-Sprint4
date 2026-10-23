# VegTrack

Aplicativo acadêmico do Challenge Motiva, FIAP, para acompanhar vegetação de trechos de rodovia e organizar ordens de serviço. Versão 4.0.0, Sprint 4.

| Integrante | RM |
|---|---|
| Rogério Deligi Ferreira Filho | 561942 |
| Maria Fernanda Garavelli Dantas | 562686 |

## Entrega final

- [Baixar APK](https://github.com/RogerioOxy/VegTrack-Sprint4/releases/download/v4.0.0/VegTrack-4.0.0.apk).
- [Vídeo final no YouTube](https://youtu.be/-MLHRctqAJE), não listado.
- [Plano de negócio](docs/PLANO-DE-NEGOCIO.md).
- [Roteiro de gravação da dupla](docs/ROTEIRO-VIDEO-SPRINT4.md).
- [Narração para gravar](docs/NARRACAO-PARA-GRAVAR-SPRINT4.txt).

Os marcadores serão substituídos após a publicação dos links pelo grupo. O APK release final foi retestado no emulador Android 14 em 21/10/2026, conforme a validação final abaixo. Os testes da Sprint 3 são históricos.

## Problema, persona e proposta

Carlos, o Cadú, é o supervisor que acompanha equipes e precisa decidir quais trechos devem receber vistoria ou intervenção. Consultar planilhas separadas dificulta relacionar medição, ordem e comprovação do serviço.

O VegTrack reúne mapa esquemático, histórico, levantamento, OS, conclusão e relatório. O técnico registra altura, foto e GPS; o supervisor acompanha ordens; o gestor consulta e exporta. Na Sprint 4, câmera e localização podem vir do dispositivo, por escolha do usuário, ou de opções demonstrativas identificadas. O [plano de negócio](docs/PLANO-DE-NEGOCIO.md) propõe uma camada de campo complementar ao monitoramento por satélite descrito pela Motiva [1], sem integração implementada com a empresa.

## Instalação do APK

1. No Android, abra [o link do APK](https://github.com/RogerioOxy/VegTrack-Sprint4/releases/download/v4.0.0/VegTrack-4.0.0.apk) e baixe o arquivo.
2. Ao abrir, se o Android solicitar, permita que o navegador ou gerenciador de arquivos usado instale apps de fontes desconhecidas. A opção costuma ficar em Configurações, Apps, Acesso especial, Instalar apps desconhecidos; o nome varia por aparelho.
3. Confirme a instalação e abra o VegTrack. O APK não precisa do Expo Go.
4. Entre com `supervisor@vegtrack.demo` e senha `vegtrack123`.
5. Em Novo levantamento ou Conclusão, toque em **Capturar localização** para pedir acesso ao GPS, ou em **Abrir câmera** para pedir acesso à câmera. Se negar, use a alternativa demonstrativa ou reveja a permissão nas configurações do Android.
6. Em emulador sem sensores disponíveis, escolha **Usar foto de exemplo** e **Usar localização demonstrativa do trecho**. A origem fica salva no registro e aparece no PDF.

## Acesso de demonstração

| Perfil | E-mail | Senha | Uso |
|---|---|---|---|
| Supervisor | supervisor@vegtrack.demo | vegtrack123 | Consulta, cadastro, execução, configuração e escala de urgência |
| Técnico | tecnico@vegtrack.demo | vegtrack123 | Consulta, levantamentos e execução |
| Gestor | gestor@vegtrack.demo | vegtrack123 | Consulta e exportação |

As contas são fictícias. Não use senhas pessoais. O login não consulta servidor nem emite token; a senha não é persistida. Os perfis são regras locais do protótipo.

## Resumo das entregas por Sprint

| Sprint | Entrega e referências |
|---|---|
| 1 | Requisitos no [repositório](https://github.com/lucasouza06/lucasouza06-Challenge-Sprint01-CPAD) e [protótipo navegável no Figma](https://www.figma.com/proto/5oamsogahmd7Se6ZgcjV5S/VegTrack-%E2%80%94-Prot%C3%B3tipo?node-id=2-3&scaling=scale-down&page-id=0%3A1&starting-point-node-id=2%3A3). |
| 2 | Mapa esquemático, ordens, levantamentos e calendário de fauna. [Repositório](https://github.com/lucasouza06/Challenge-Sprint02-CPAD) e [vídeo](https://www.youtube.com/watch?v=1TPgrU_rzcM). |
| 3 | Persistência, regras, perfis, fila offline demonstrativa e PDF. [Repositório](https://github.com/RogerioOxy/VegTrack-Sprint3), [vídeo](https://www.youtube.com/watch?v=QTra6W7b7rU) e [testes manuais](docs/TESTES-MANUAIS.md). |
| 4 | GPS e foto do dispositivo com alternativas identificadas, configuração para APK, plano de negócio e documentação final. [Este repositório](.), [plano](docs/PLANO-DE-NEGOCIO.md), [APK](https://github.com/RogerioOxy/VegTrack-Sprint4/releases/download/v4.0.0/VegTrack-4.0.0.apk) e [vídeo final](https://youtu.be/-MLHRctqAJE). |

Nas Sprints 1 e 2, o grupo tinha seis integrantes; a partir da Sprint 3, a entrega é da dupla identificada acima.

## Pontos da Sprint 3 e o que foi feito

| Pendência da Sprint 3 | Situação nesta entrega | Motivo e próximo passo |
|---|---|---|
| 1. Testar no aparelho e conectar câmera, GPS e permissões | Câmera e GPS validados em emulador; aparelho físico não testado | APK release final retestado no Android 14, API 34, em 21/10/2026, com instalação do zero e permissões solicitadas no primeiro toque. Captura, confirmação da foto e leitura de coordenadas funcionaram; a câmera sintética salvou quadro preto com data e hora. Próximo passo: testar em aparelho físico. |
| 2. API, autenticação no servidor e tokens seguros | Mantido como limite | Não há contrato de API ou servidor integrado; o login fictício não é autenticação de produção. |
| 3. Push em segundo plano | Mantido como limite | Caixa de avisos simulada, sem serviço de push integrado. |
| 4. Homologar regras operacionais e ambientais | Mantido como limite | Critérios e calendário fictícios. Não encontramos norma da ARTESP que fixe a altura de roçada usada nos níveis do app. |
| 5. Conflitos e proteção de dados na sincronização real | Mantido como limite | Fila e sincronização locais preservadas. Não existe envio ao servidor ou resolução de conflitos entre aparelhos. |
| 6. Atualizar Expo com regressão | Mantido como limite | SDK 51 mantido por continuidade. Atualização exige outro ciclo de build e regressão. |

Os ajustes de espaçamento, limite de 30 cm, PDF e estados da Sprint 3 estão nos [testes históricos](docs/TESTES-MANUAIS.md). A exportação final com foto de exemplo foi validada no emulador Android, conforme a tabela abaixo; o reteste informado não inclui PDF com foto do dispositivo.

## Status por funcionalidade

| Função | Real ou demonstrativo na versão 4 |
|---|---|
| Mapa e histórico (RF001, RF003) | Mapa esquemático e trechos fictícios; consulta e persistência locais funcionais. |
| Levantamento (RF002) | Altura digitada, regras locais, foto e GPS com origem independente salva. |
| Foto | Android: captura, prévia, refazer e cópia em `documentDirectory/evidencias/`. Exemplo licenciado opcional. Web: somente exemplo. |
| GPS | Android: permissão em primeiro plano por botão, precisão alta e limite de 15 s para leitura. Negação, serviço desligado e falha têm mensagem e alternativa explícita. Web: coordenadas demonstrativas do trecho. |
| Fauna e restrições (RF004, RF005) | Calendário, mês e bloqueio ambiental demonstrativos. |
| Avisos (RF006) | Caixa local e simulação de evento; sem push. |
| OS (RF007, RF008) | Criação, reaproveitamento sem duplicidade, início e escala no domínio local. |
| Conclusão (RF009) | Foto e GPS obrigatórios, origens salvas, data automática e bloqueio de segunda conclusão. |
| Login e perfis (RF010) | Contas fictícias e autorização local por perfil. |
| Intervalo (RF011) | Configuração local aplicada às consultas e ações. |
| PDF (RF012) | Exportação nativa com foto de cada OS, rótulos de origem e créditos no exemplo. Web: impressão pelo navegador. |
| Offline | Persistência e fila locais; sincronização simulada, sem API. |
| Mais | Versão da configuração Expo e explicação do que é real e demonstrativo. |

## Stack e execução do código

React Native 0.74.5, Expo SDK 51, React 18, TypeScript, React Navigation, Context API e AsyncStorage. Sensores: expo-camera 15 e expo-location 17. Arquivos: expo-file-system 17. PDF: expo-print e expo-sharing. Mais lê a versão por expo-constants, já disponível na árvore instalada do Expo. Não foram adicionadas dependências.

Com Node.js e npm, após instalar as dependências do projeto:

```sh
npm ci
npm start
npm test
npm run typecheck
npm run export:web
```

## Como gerar o APK a partir do código

Prepare JDK 17, Android SDK 34 e NDK 26.1. Configure `JAVA_HOME` para o JDK e `ANDROID_HOME` para o SDK. Com as dependências instaladas, na raiz:

```sh
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

No Windows PowerShell, entre em `android` e execute `./gradlew.bat assembleRelease`. O resultado fica em `android/app/build/outputs/apk/release/app-release.apk`. Após alterar permissões no `app.json`, gere novamente a configuração nativa com o prebuild antes de compilar. Disponibilize o APK testado pelo link, sem adicionar o binário ao repositório.

### Build e teste realizados

APK release gerado localmente com Gradle, JDK 17, Android SDK 34 e NDK 26.1, versão 4.0.0 e código 4. Foi assinado com a chave de depuração do template, adequada para distribuição acadêmica por link, sem adequação para publicação na Play Store, e instalado e testado no emulador Android 14, Pixel, API 34.

| Percurso no APK | Resultado |
|---|---|
| Login de supervisor e dashboard | Funcionaram no emulador. |
| Levantamento de 35 cm no KM 23,5 a 24,0 | Registrado; gerou a OS-2026-0849 no reteste final. |
| Câmera: permissão, prévia emulada, captura, confirmação e rótulo de dispositivo | Validados no primeiro toque no reteste final; quadro capturado preto com data e hora pela câmera sintética do emulador. |
| Localização demonstrativa e captura de GPS do dispositivo | Validadas no emulador; GPS após a permissão no primeiro toque, com coordenadas do simulador e precisão informada de ±5,0 m. |
| Início e conclusão de OS com foto de exemplo e GPS demonstrativo | OK no reteste final, com os dois selos de origem visíveis. |
| Trilha de auditoria | Funcionou no emulador. |
| Exportação de PDF com foto de exemplo | Gerou PDF de 1 página e abriu o compartilhamento do Android; pré-visualização conferida no reteste final. PDF com foto do dispositivo não incluído no reteste informado. |

### Validação final do APK

Data: **21/10/2026**. Resultados informados pelo grupo para o APK release final, versionName 4.0.0 e versionCode 4, instalado do zero no emulador Android 14 (API 34), sem permissões prévias. Permissões declaradas: câmera e localização, mais as padrão do Expo; `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW` e `ACTIVITY_RECOGNITION` ausentes.

| Teste no APK | Resultado |
|---|---|
| Login como supervisor | OK |
| Barra de abas ao digitar a altura | Oculta enquanto o teclado está aberto |
| Câmera com permissão pedida no primeiro toque | Prévia e fluxo OK; no emulador a biblioteca devolve foto simulada |
| GPS real com permissão pedida no primeiro toque | Coordenadas do simulador do emulador (-23,532900; -46,801498) e "Precisão informada: ±5,0 m" após "Permitir" |
| Levantamento de 35 cm no KM 23,5 a 24,0 | Registrado; gerou a OS-2026-0849 |
| Início e conclusão da OS com foto de exemplo e GPS demonstrativo | OK, selos "Foto de exemplo" e "GPS demonstrativo" visíveis |
| Exportar PDF da OS concluída | Gerou VegTrack_ordem_2026-10-21-01-44-58.pdf e abriu o compartilhamento do Android; a pré-visualização mostrou 1 página com dados da OS, foto de exemplo com crédito, GPS "-23,744500 / -46,583400, precisão 7,4 m" e histórico |
| Tela Mais | "Sobre o VegTrack 4.0.0" |

Observação: no emulador, o `expo-camera` 15 não usa a câmera ao capturar e devolve uma imagem simulada preta com data e hora (comportamento da biblioteca, `CameraViewModule.kt`, função `takePicture`). A prévia ao vivo, a permissão, a cópia para o armazenamento do app e o rótulo "Foto do dispositivo" foram verificados. A captura real depende de aparelho físico, que não foi testado. Não houve teste em iOS.

## Sobre Flutter

O grupo manteve React Native e Expo para dar continuidade ao código e aos fluxos anteriores. Não houve migração para Flutter. O procedimento escolhido para gerar o APK é o build local Gradle a partir do projeto Expo, como alternativa de empacotamento Android ao EAS citado no enunciado.

## Limites e evidências

Dados iniciais, trechos entre KM 23 e 67, regras, prazos e meses não são dados operacionais da Motiva. Os níveis 1, 2 e 3 não certificam norma da ARTESP. O GPS informa onde está o aparelho e não certifica presença no trecho escolhido; a conferência cabe ao usuário.

Fotos ficam no espaço privado do app e registros no AsyncStorage, sem criptografia implementada pelo projeto. Limpar dados ou desinstalar pode apagar registros e fotos. Fotos substituídas e cópias de formulários abandonados não têm limpeza automática; não há política de retenção de produção. O timeout encerra a espera na tela, mas a API usada não permite cancelar a solicitação nativa; resultados tardios são ignorados.

A foto de exemplo e os créditos permanecem em [CREDITOS.md](docs/CREDITOS.md). Registros antigos sem origem são tratados como demonstrativos, pois a Sprint 3 não capturava sensores. Não há SSO, backend, FastAPI/GBIF, satélite, auditoria imutável ou sincronização entre aparelhos.

Os [testes de Android e PDF da Sprint 3](docs/TESTES-MANUAIS.md), as [imagens históricas](docs/imagens/) e o [PDF histórico](docs/EXEMPLO-RELATORIO.pdf) não comprovam a versão 4. O reteste do APK final no emulador está registrado acima. Aparelho físico e iOS não foram testados.

O envio à FIAP deve ser apenas um TXT com os dois nomes e RMs, link do repositório final, APK e vídeo não listado. A dupla grava com a própria voz, conforme [roteiro](docs/ROTEIRO-VIDEO-SPRINT4.md). Não use narração automatizada.

## Referências

[1] Motiva. Rodoanel utiliza inteligência artificial para elevar padrão de manutenção, 17/12/2025. [Publicação institucional](https://rodovias.motiva.com.br/rodoanel/noticias/2025/dezembro/rodoanel-utiliza-inteligencia-artificial-para-elevar-padrao-de-m/).
