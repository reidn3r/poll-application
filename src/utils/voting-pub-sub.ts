//Informações a serem recebidas quando uma mensagem for publicada em um canal
    //Dados recebidos quando um novo voto é publicado
type Message = { pollOptionId: string, votes: number }; //payload retornado ao frontend após emitir (publicar) evento em um canal

//Função anonima com parametros que auxiliam a identificação de novos votos (?)
    //Função chamada ao registrar um voto
type Subscriber = (message: Message) => void    //Pode ser implementado um comportamento

class VotingPubSub {
    private channels: Record<string, Subscriber[]> = {}

    subscribe(pollId: string, subscriber: Subscriber){ //Add. um novo subscriber
        if(!this.channels[pollId]){ //Se não há subscribers:
        /*
        1.0: Inicializa um array de subscribers
            1.1: Ocorre quando é inscrito o primeiro subscriber
            1.2: Antes disso, não há array de subscribers
        */
            this.channels[pollId] = [];
        }
        this.channels[pollId].push(subscriber);
    }

    publish(pollId: string, message: Message){
        if(!this.channels[pollId]) return;
        for(const sub of this.channels[pollId]){
            sub(message);
        }
    }
}

export const pubsub = new VotingPubSub();