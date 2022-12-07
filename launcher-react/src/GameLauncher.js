import './GameLauncher.css'
import {useCallback, useRef, useState} from "react";

const TICKET_COST = 1;

export default ({gameId}) => {
    const [playerBalance, setPlayerBalance] = useState(100)
    const [tickets, setTickets] = useState({})

    const iframeRef = useRef(null);

    /** Purchase a new blockchain ticket for the gameId */
    const buyTicket = (gameId) => {
        console.log('launcher', `buyTicket(gameId: ${gameId})`);
        return mockTicket(gameId);
    }

    const mockTicket = useCallback((gameId) => {
        const ticket = {
            gameId: gameId,
            ticketId: Math.round(Math.random() * 1000000),
            ticketCost: TICKET_COST,
            outcomes: [500, 979, 999, 1000],
            payouts: [0, 1, 3, 75],
            rng: Math.round(Math.random() * 1000),
            played: false,
            balance: playerBalance - TICKET_COST
        };

        setPlayerBalance(playerBalance - TICKET_COST);

        const updatedTickets = {...tickets};
        updatedTickets[ticket.ticketId] = ticket;
        setTickets(updatedTickets);

        return ticket;
    }, [playerBalance, tickets]);

    const addToPlayerBalance = useCallback((change) => {
        const newBalance = playerBalance + change;
        setPlayerBalance(newBalance);

        console.log('launcher', `balanceChange(${newBalance})`);
        sendBalanceToGameUi(newBalance);
    }, [playerBalance]);

    const ticketValue = (ticket) => {
        const resultInd = ticket.outcomes.findIndex((value) => { // 0, 1, 2, 3
            return ticket.rng < value
        })
        return ticket.payouts[resultInd];
    }

    /** Claim the prize for a game on the blockchain */
    const claimPrize = (gameId, ticketId) => {
        console.log('launcher', `claimPrize(gameId: ${gameId}, ticketId: ${ticketId})`);

        const ticket = tickets[ticketId];
        if (ticket['claimed'])
            return;

        ticket['claimed'] = true
        addToPlayerBalance(ticketValue(ticket));
    };

    /** Save the game and ticket specific progress information */
    const saveGameProgress = (gameId, ticketId, data) => {
        console.log('launcher', `saveGameProgress(gameId: ${gameId}, ticketId: ${ticketId}, data: ${data})`);
    };

    /** Send game state 'ticket' to the user interface in an async message */
    const sendTicketToGameUi = (ticket) => {
        const game = iframeRef.current;
        game.contentWindow.postMessage({action: 'play', ticket}, '*');
    }

    /** Send updated balance the user interface in an async message */
    const sendBalanceToGameUi = (balance) => {
        const game = iframeRef.current;
        game.contentWindow.postMessage({action: 'balanceChange', balance}, '*');
    }

    const readyToPlay = (gameId) => {
        console.log('launcher', 'readyToPlay');

        // generate new ticket if the clicked one is already played
        sendTicketToGameUi(mockTicket(gameId));
    };

    window.onmessage = function (e) {
        if (e.data?.action === 'buyTicket') {
            const ticket = buyTicket(e.data?.gameId)

            sendTicketToGameUi(ticket);
        } else if (e.data?.action === 'claimPrize') {
            claimPrize(e.data?.gameId, e.data?.ticketId);
        } else if (e.data?.action === 'saveGameProgress') {
            saveGameProgress(e.data?.gameId, e.data?.ticketId, e.data?.data);
        } else if (e.data?.action === 'readyToPlay') {
            readyToPlay(gameId);
        } else {
            console.warn('launcher', 'Unrecognized message', e.data);
        }
    };

    return (
        <div>
            <iframe
                src="game/game_if.html"
                ref={iframeRef}
                title="Cherry Garden"></iframe>
        </div>
    )
}
