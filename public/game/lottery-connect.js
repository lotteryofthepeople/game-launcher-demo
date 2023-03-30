class LotteryConnect {
    constructor() {
        this.has_launcher = false

        const roundHalfEven = (n) => {
            return Math.round(n*100)/100;
        }

        window.onmessage = (e) => {
            if (e.data?.action === 'play') {
                this.has_launcher = true

                if(!this.checkTicket(e.data?.ticket, true)) {
                    console.error('game', 'play - invalid ticket', e.data?.ticket)
                } else {
                    console.log('game', 'play', e.data?.ticket)
                }

                // fix balance
                if (e.data?.ticket?.balance) {
                    e.data.ticket.balance = roundHalfEven(e.data.ticket.balance)
                }

                this.onPlay(e.data?.ticket)
            } else if (e.data?.action === 'balanceChange') {
                console.log('game', 'balanceChange', e.data?.balance)
                this.has_launcher = true
                this.onBalanceChange(e.data?.balance)
            }
        }
    }

    /** Set the onPlay method to receive game tickets */
    onPlay = (ticket) => {
        throw new Error(`You have to set onPlay to receive game ticket ${ticket}`)
    }

    /**
     *  Registers the play handler function which prepares the UI with the new game state
     *  Calling this function signals that the UI is ready and tickets can be received.
     */
    readyToPlay = () => {
        console.log('game', 'readyToPlay')
        window.top.postMessage({action: 'readyToPlay'}, '*')
    }

    /** Initiate the purchase of a new ticket for this game */
    buyTicket = (gameId, ticketCount) => {
        if (this.has_launcher) {
            console.log('game', 'buyTicket', gameId, ticketCount)
            window.top.postMessage({action: 'buyTicket', gameId, ticketCount}, '*')
        } else {
            console.warn('game', 'buyTicketMock', gameId, ticketCount)
            this.onPlay(this.createMockTicket(gameId))
        }
    }

    /** Initiate the claiming of the prize for a winning ticket */
    claimPrize = (gameId, ticketId) => {
        console.log('game', 'claimPrize', gameId, ticketId)
        window.top.postMessage({action: 'claimPrize', gameId, ticketId}, '*')
    }

    /** Save Game progress for a ticket */
    saveGameProgress = (gameId, ticketId, data) => {
        console.log('game', 'saveGameProgress', gameId, ticketId, data)
        window.top.postMessage({action: 'saveGameProgress', gameId, ticketId, data}, '*')
    }

    /** Optional balance change handler */
    onBalanceChange = (balance) => {
        console.debug('game', 'balance', balance)
    }

    createMockTicket = (gameId) => {
        return {
            gameId: gameId,
            ticketId: Math.round(Math.random() * 1000000),
            ticketCost: 1,
            outcomes: [500, 979, 999, 1000],
            payouts: [0, 1, 3, 75],
            rng: Math.round(Math.random() * 999) + 1,
            saveData: {},
            balance: 100,
            remainingTickets: Number.POSITIVE_INFINITY
        }
    }

    checkTicket = (ticket, log = false) => {
        const warnings = [
            [() => ticket?.gameId !== undefined, 'ticket.gameId is undefined'],
            [() => ticket?.ticketId !== undefined, 'ticket.ticketId is undefined'],
            [() => ticket?.balance !== undefined, 'ticket.balance is undefined'],
            [() => ticket?.remainingTickets !== undefined, 'ticket.remainingTickets is undefined']
        ]
        const errors = [
            [() => ticket !== undefined, 'ticket is undefined'],
            [() => ticket?.outcomes !== undefined, 'ticket.outcomes is undefined'],
            [() => ticket?.payouts !== undefined, 'ticket.payouts is undefined'],
            [() => ticket?.rng !== undefined, 'ticket.rng is undefined'],
            [() => ticket?.outcomes?.length === ticket?.payouts?.length,
                `ticket.outcomes.length: ${ticket?.outcomes?.length} != ticket.payouts.length: ${ticket?.payouts?.length}`],
            [() => ticket?.payouts?.every((p) => p >= 0), `ticket.payouts should be all >= 0 ${ticket?.payouts}`],
            [() => ticket?.outcomes?.every((value, i, outcomes) =>
                i >= outcomes.length - 1 || value < outcomes[i + 1]), `ticket.outcomes should be monotonically increasing ${ticket?.outcomes}`],
            [() => 1 <= ticket?.rng && ticket?.rng <= ticket?.outcomes?.at(ticket?.outcomes?.length - 1),
                `ticket.rng: ${ticket?.rng} should be between 1 and max(outcomes): ${ticket?.outcomes?.at(ticket?.outcomes?.length - 1)} inclusive`]
        ]

        warnings.forEach(([condition, msg]) => {
            if (!condition() && log)
                console.warn(msg)
        })

        return errors.every(([condition, msg]) => {
            const result = condition()
            if (!condition() && log)
                console.error(msg)
            return result
        })
    }
}

window.lotteryApp = new LotteryConnect()
