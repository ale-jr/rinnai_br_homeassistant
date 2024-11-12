# Este repositótio está arquivado
Não tenho mais um aquecedor compatível logo não tenho mais uma forma de resolver bugs e criar novas features, existe uma integração desenvolvida pelo [@mukaschultze](https://github.com/mukaschultze/)  com muito mais features que pode ser acessada neste repo [aqui](https://github.com/mukaschultze/ha-aquecedor-rinnai)
# Integração Módulo Wifi Rinnai com Home Assistant (Não oficial)
Addon para integrar no Home Assistant os aquecedores de água a gás da Rinnai Brasil que suportam o módulo ROU003.

# Considerações
- Este projeto foi desenvolvido sob a licença MIT, sendo que este addon não foi certificado nem validado pela Rinnai, ao utilizar este addon você concorda com a utilização por sua própria conta e risco, não me reponsabilizo por nenhum mal funcionamento e/ou danos do aquecedor, módulo ou aplicativos (rinnai e home assistant) bem como danos físicos e materiais que possam ser causados pela utilização deste projeto. Você foi avisado!
- O módulo foi instalado no aquecedor REUE27, acho dificil alguma coisa mudar entre os modelos, porém tem a possibilidade de aparecer algum bug ou algo do tipo, especialmente na parte de definir temperaturas

# Instalação
## Pré requisitos
1. Por ser um addon e não uma integração em si (quem sabe isso não vira uma integração no futuro 😅), é necessário que a [integração MQTT](https://www.home-assistant.io/integrations/mqtt/) esteja configurada na sua instância para que as entidades relacionadas ao aquecedor sejam criadas
2. Configurar o módulo no App oficial da Rinnai, dica: Eu só consegui configurar o módulo no App com um celular mais antigo (Androind 10) então se vocês estiver enfrentando problemas em versões mais novas do Android/iOS talvez dê para configurar com um dispotivo mais antigo (dá para usar a feature de convite para usar o seu celular mais atual depois de configurar)
3. Descobrir o IP do módulo na sua rede, essa parte é mais chatinha e como o módulo não utiliza mDNS nem define um nome de host é mais dificil de achar, uma das formas mais fáceis é ver no seu roteador ou utilizar um app chamado [Net Analyzer](https://play.google.com/store/apps/details?id=net.techet.netanalyzerlite.an) para descobrir quais são os ips na sua rede e ir tentando para cada endereço acessar a url `http://ip/bus` até ver ver uma tela cheia de números. Com o Net Analyzer é só tentar os endereços que tenham o fabricante `Espressif Inc.` (Sim, cobram 300 reais por um esp8266, mas até ai você pagou muito mais pelo software do que pelo hardware 😅😅😅😅)
4. Adicione e instale este repositório como um repositório de addons do home assistant:
     - Em [http://homeassistant.local:8123/hassio/store](http://homeassistant.local:8123/hassio/store), clique no menu superior direito e depois clique em "repositórios"
     - Cole a url deste projeto `https://github.com/ale-jr/rinnai_br_homeassistant`, clique em adicionar e feche o modal
     - Clique botão no botão superior esquerdo e depois em "Verifique se há atualizações"
     - Pesquise por "Aquecedor Rinnai" e clique no card que aparecer, se não aparecer nenhum, tente reiniciar a instância do home assistant
     - Instale o addon
5. Configure as variáveis
Na tela do addon clique em "Ajustes" e preencha os campos
    - `device_model`: Modelo do seu aquecedor, exemplo: reue27 (por hora esse campo só vai servir para definir o nome do dispositivo no home assistant, porém pode ser que seja usado no futuro para descobrir o dispositivo na rede)
    - `device_serial_number`: Número de série do seu aquecedor (esse campo só vai ser usado para definir o serial number do dispositivo no home assistant)
    - `device_host`: O endereço de IP do módulo
    - `device_poll_interval`: De quanto em quanto tempo (em segundos) o addon deve atualizar o estado do aquecedor, se você continuar usando o aplicativo da rinnai é aconselhável deixar a partir de 30 segundos, menos que isso e o app oficial pode começar a ficar lento ou parar de funcionar as vezes
    - `mqtt_host`: ip do seu broker mqtt, se você usa o addon de broker do HA o host deve ser o mesmo IP do home assistant (no futuro eu quero pegar essas configs via HA ao invés de variáveis)
    - `mqtt_user`: usuário mqtt do seu broker mqtt
    - `mqtt_password`: senha do usuário do seu borker mqtt
    - `ha_ip`: endereço ip da sua instância do home assistant (não pode ser localhost) pois esse endereço deve ser o mesmo que o módulo ira reconhecer como origem da requisição, isso é importante para definir a prioridade na hora de definir a temperatura (explico mais sobre isso abaixo)
6. Inicie o addon e aguarde as entidades serem criadas. Na página de dispositivos, o aquecedor vai aparecer como um dispositivo no card do MQTT, já contendo todas as entidades (por enquanto temos as entidades: status, temperatura definida, temperatura de entrada e saida, porém mais serão adicionadas no futuro)
7. Agora é só adicionar as entidades no seu painel e/ou fazer automações :D 

# Contribuindo com o projeto
## Iniciar o projeto localmente em modo de desenvolvimento
Para facilitar o desenvolvimento de novas features é possível rodar o projeto localmente de forma independente do home assistant. Para isso basta seguir estes passos:
1. Clone este repo
2. Entre em `modulo_aquecedor_rinnai_brasil`
3. `npm install` para instalar as depedências necessárias
4. Crie uma cópia do arquivo `options-mock-example.json` com o nome `options-mock.json` e defina todos os campos seguindo o padrão de configuração descrito na seção de instalação do addon, você deve utilizar o mesmo broker mqtt que o HA utiliza para que o dispositivo e as entidades sejam criadas na instância do HA. É aconselhável definir o serial number como "debug" ou algo do tipo para não "sujar" o dispotivo que você pretende usar no dia a dia
5. `npm run dev` para subir o projeto em modo de desenvolvimento com recarregamento automático caso algum arquivo seja alterado

## PRs e issues
Encontrou algum problema? Tem alguma sugestão de melhorias? Bastar criar uma issue no projeto explicando o que aconteceu, o addon possui alguns logs, sinta se livre para anexar estes logs na hora de abrir a issue. 
Quer colocar a mão na massa, faça um fork desse repo, code a feature/bugfix e abra um PR apontando para o branch main (por enquanto 😅, se isso crescer a gente pensa em organizar melhor)



# API
Documentação dos endpoints baseado nas requests que o aplicativo oficial faz

## Conceitos
### Prioridade para definir temperatura
Não sei ao certo o porquê dessa feature, mas quando o aquecedor está em funcionamento os comandos de aumentar/diminuir a temperatura só funcionam para o ip do dispositivo que possui "prioridade". Além disso, quando algum ip está como prioritário, nenhum outro dispositivo conseuge definir a temperatura e no app oficial o ícone do cadeado vai ficar vermelho. 
#### Comportamento no addon 
Toda vez antes de mudar a temperatura é verificado se existe alguma dispositivo com prioridade, se existir a temperatura não será alterada. Se não houver, antes de iniciar os comandos para alterar a temperatura o addon vai definir a prioridade para o IP da instância e logo após o término dos comandos o addon vai definir a prioridade para `null`

### Temperatura não "linear"
Existem alguns "gaps" na hora de definir a temperatura, dos 35 até os 46 graus a temperatura pode ser definida com a precisão de um grau, após os 46 é possivel definir apenas a temperatura para 48, 50, 55 e 60 graus. a temperatura é definida chamando dois endpoints, um para aumentar a temperatura e outro para diminuir, ambos emulam o botão físico 
### Comportamento no addon
Quando uma temperatura fora desse gap for definida a temperatura será ajustada para a menor temperatura possível dentro das opções, exemplo, ao definir 58 graus na entidade do home assistant, a temperatura no aquecedor será definida em 55 e o estado será atualizado para 55

Ao invés de arredondar, eu escolhi essa abordagem para evitar que uma temperatura mais alta seja defina

## Informações básicas (tela de controle)
Request:
```
GET /tela_
```
Response: 
```
41,0,0,18,1374,0,null:pri,20,1098019,Sep 16 2022,15,0,0,0
```
Descrição das propriedades separadas por vírgula
- 0: Status do aquecedor (se deve aquecer a água) 
    - `41` e `42`: aquecedor ligado
    - `11`: aquecedor desligado
- 1: Desconhecido (não aparenta mudar, ficando sempre em `0`)
- 2: Status de operação (se estã em combustão)
    - `0`: aquecedor não está em funcionamento
    - `1`: aquecedor está em funcionamento 
- 3: Total de horas em combustão 
- 4: Total de horas em standby
- 5: Fluxo de água em litros por minuto * 100 (exemplo `414` equivale a 4,14 litros por minuto)
- 6: Ip do dispositivo que possui prioridade na hora de definir a temperatura no formato `ip:pri` (exemplo: `192.168.0.2:pri`), quando nenhum ip possui prioridade será definido como `null:pri`
- 7: Temperatura definida (a mesma do painel), valores não são lineares:
    - `3` : 35 graus
    - `4` : 36 graus
    - `5` : 37 graus
    - `6` : 38 graus
    - `7` : 39 graus
    - `8` : 40 graus
    - `9` : 41 graus
    - `10`: 42 graus
    - `11`: 43 graus   
    - `12`: 44 graus 
    - `13`: 45 graus 
    - `14`: 46 graus 
    - `16`: 48 graus 
    - `18`: 50 graus
    - `19`: 55 graus
    - `20`: 60 graus  
- 8: Quantidade de segundos desde o último boot do módulo 
- 9: Alguma data que eu não descobri ao certo o que significa `<Abreviação do mês em inglês> dia ano`, exemplo: Sep 16 2022
- 10: Desconhecido (não aparenta mudar, ficando sempre em `15`)
- 11: Desconhecido (não aparenta mudar, ficando sempre em `0`)
- 12: Desconhecido (não aparenta mudar, ficando sempre em `0`)
- 13: Desconhecido (não aparenta mudar, ficando sempre em `0`)

## Parametros do aquecedor (tela modo de depuração)
Request:
```
GET /bus
```
Response: (Alguns itens foram substituidos por letras por serem dados sensíveis)
```
41,0,0,0,18,1380,10000,0,0,0,1260,2309,0,240,170,4000,192.168.15.11,null:pri,8,XXXXXXXX,XXXX,0,Sep 16 2022,15,Exception,xx:xx:xx:xx:xx:xx,0,0,4,0,0,0,0,100,100,0,0,-50,[0],2
```
Descrição das propriedades separadas por vírgula
- 0 : `41` -  Status do aquecedor (se deve aquecer a água) 
    - `41` e `42`: aquecedor ligado (não entendi ao certo qual a diferença entre esses números)
    - `11`: aquecedor desligado
- 1 : `0` - Desconhecido
- 2 : `0` - Desconhecido
- 3 : `0` - Desconhecido
- 4 : `18` - Total de horas em combustão
- 5 : `1380` - Total de horas em standby
- 6 : `10000` - "Auto diagnóstico da venotoinha" * 10
- 7 : `1973` - Rotação da venotinha (Hz) * 10, no caso 197.3Hz
- 8 : `1159` - Corrente POV (mA) * 10, no caso 115.9mA
- 9 : `10590` - Potência máxima (kcal/min) * 10, no caso 105.9 kcal/min 
- 10: `1260` - Temperatura de entrada da água * 100 no caso 12.6 graus
- 11: `2309` - Temperatura de saída da água * 100, no caso 23.09 graus
- 12: `680` - Fluxo de água (l/min) * 10, no caso 6,8 l/min
- 13: `240` - Vazão mínima para acionamento (l/min) * 10, no caso 2.4 l/min 
- 14: `170` - Vazão mínima para desligamento (l/min) * 10, no caso 17.0 l/min
- 15: `4000`: Temperatura definida * 100, no caso 40 graus
- 16: `X.X.X.X` - IP do módulo
- 17: `null:pri` - Ip do dispositivo que possui prioridade na hora de definir a temperatura no formato `ip:pri` (exemplo: `192.168.0.2:pri`), quando nenhum ip possui prioridade será definido como `null:pri`
- 18: `8` - Temperatura definida (a mesma do painel), valores não são lineares (igual ao sétimo item do endpoint `/tela_`)
- 19: `XXXXXXXX` - Número de série do aquecedor
- 20: `XXXX` - Desconhecido os três últimos digítos compõem o convite (esse endpoint é chamado toda vez que o botão de gerar convite é acionado)
- 21: `0` - Desconhecido
- 22: `Sep 16 2022` - Alguma data que eu não descobri ao certo o que significa `<Abreviação do mês em inglês> dia ano`, é a mesma do endpoint `/tela_`
- 23: `15` - Desconhecido
- 24: `Exception` - Desconhecido
- 25: `xx:xx:xx:xx:xx:xx` - Mac address do módulo
- 26: `0` - Desconhecido
- 27: `0` - Desconhecido
- 28: `4` - Desconhecido
- 29: `0` - Desconhecido
- 30: `0` - Desconhecido
- 31: `0` - Desconhecido
- 32: `0` - Desconhecido
- 33: `100` - Desconhecido
- 34: `100` - Desconhecido
- 35: `0` - Desconhecido
- 36: `0` - Desconhecido
- 37: `-50` - Potência do wifi em dBm
- 38: `[0]` - Desconhecido
- 39: `2` - Desconhecido


## Controle de temperatura

Request: Aumenta temperatura em um "step"
```
/inc
```
Response: Retorna o mesmo valor do endpoint `/tela_`
```
41,0,0,18,1380,0,null:pri,13,5327,Sep 16 2022,15,0,0,0
```

Request: Diminui temperatura em um "step"
```
/dec
```
Response: Retorna o mesmo valor do endpoint `/tela_`
```
41,0,0,16,1380,0,null:pri,13,5327,Sep 16 2022,15,0,0,0
```
## Ligar/Desligar aquecedor
Request: Alterna entre ligar e desligar
```
/lig
```
Response:Retorna o mesmo valor do endpoint `/tela_`
```
11,0,0,18,1380,0,null:pri,12,5437,Sep 16 2022,15,0,0,0
```

## Consumo semanal
Request: 
```
/consumo
```
Response:
```
97:20,382,9457,145:17,577,15477
```
Descrição das propriedades separadas por vírgula
- 0: `97:20` - Minutos e segundo (semana atual) separados por dois pontos
- 1: `382` - Quantidade de agua usada em litros (semana atual)
- 2: `9457` - Consumo de gás em kcal (semana atual) 9400 kcal equivalem a 1m³ de gás natural 
- 3: `145:17`- Minutos e segundo (semana anterior) separados por dois pontos
- 4: `577` - Quantidade de agua usada em litros (semana anterior)
- 5: `15477` - Consumo de gás kCal (semana anterior) 9400 kcal equivalem a 1m³ de gás natural 

## Histórico
Request: 
```
/historico
```
Response:
```
17:30,9,65,1327,1669228461;1:57,9,5,69,1669227406;13:04,13,43,1130,1669206601;21:07,13,82,2244,1669106217;20:41,8,89,1922,1668984818;21:06,12,83,2168,1668972831;1:00,20,9,394,1668873479;17:27,12,64,1706,1668801820;18:21,9,61,1282,1668762456;2:16,8,5,119,1668761297;
```
Histórico de uso separado entre `;` para cada uso e entre `,` para cada parâmetro de uso. Registros sâo ordenados dos mais atuais para os mais antigos
Parametros por registro
- 0: `17:30` - Minutos e segundos separados por `:`
- 1: `9` - Temperatura definida usando o mesmo dicionário do endpoint `/tela_`, (9 equivale a 41 graus)
- 2: `65` - Consumo de agua em litros
- 3: `1327` - Consumo de gás em kcal (9400 kcal equivalem a 1m³ de gás natural) 
- 4: `1669228461` - Timestamp do inicio do registro em segundos (GMT-3)

## Endpoints a serem documentados:

- `/erros` (não tive nenhum erro no uso ainda para conseguir esse log 😅) 



# Melhorias
- Trazer credenciais do MQTT via home assistant ao invés de variáveis de configuração
- Organizar o código
- Começar a trazer métricas de consumo 
- Criar um card para exibir melhor o aquecedor na UI
- Obter configutações de um convite ao invés de ter que configurar o IP
- Talvez migrar de um addon para uma integração
