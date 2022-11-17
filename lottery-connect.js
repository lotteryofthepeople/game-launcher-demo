class LotteryConnect {
    constructor() {
        const game_url = window.location.protocol !== 'file:' ? window.location.protocol + '//' + window.location.host : null;

        this.has_launcher = false;

        window.onmessage = (e) => {
            if (game_url && e.origin !== game_url) // basic security
                return;

            if (e.data?.action === 'play') {
                console.log('game', 'play', e.data?.ticket);
                this.has_launcher = true;
                this.onPlay(e.data?.ticket)
            } else {
                console.warn('game', 'Unrecognized message', e.data);
            }
        };
    }

    /** Set the onPlay method to receive game tickets */
    onPlay = (ticket) => {
        throw new Error('You have to set onPlay to receive game tickets')
    };

    /**
     *  Registers the play handler function which prepares the UI with the new game state
     *  Calling this function signals that the UI is ready and tickets can be received.
     */
    readyToPlay = () => {
        console.log('game', 'readyToPlay');
        window.top.postMessage({action: 'readyToPlay'}, '*');
    }

    /** Initiate the purchase of a new ticket for this game */
    buyTicket = (gameId) => {
        if (this.has_launcher) {
            console.log('game', 'buyTicket', gameId);
            window.top.postMessage({action: 'buyTicket', gameId}, '*');
        } else {
            console.warn('game', 'buyTicketMock', gameId);
            this.handlePlay(this.createMockTicket(gameId));
        }
    }

    /** Initiate the claiming of the prize for a winning ticket */
    claimPrize = (gameId, ticketId) => {
        console.log('game', 'claimPrize', gameId, ticketId);
        window.top.postMessage({action: 'claimPrize', gameId, ticketId}, '*');
    }

    createMockTicket = (gameId) => {
        return {
            gameId: gameId,
            ticketId: Math.round(Math.random() * 1000000),
            ticketCost: 1,
            outcomes: [500, 979, 999, 1000],
            payouts: [0, 1, 3, 75],
            rng: Math.round(Math.random() * 1000),
            played: false,
            balance: 100
        };
    }
}

window.lotteryApp = new LotteryConnect()
