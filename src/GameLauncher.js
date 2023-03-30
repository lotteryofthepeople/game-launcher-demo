import './GameLauncher.css'
import {useCallback, useEffect, useRef, useState} from "react";

const TICKET_COST = 1.01;

export const GameLauncher = ({gameId}) => {
    const [playerBalance, setPlayerBalance] = useState(100)
    const [tickets] = useState(new Map())

    const iframeRef = useRef(null);
    const [height] = useState("800px");

    /** Purchase a new blockchain ticket for the gameId */
    const buyTicket = (gameId, ticketCount) => {
        let newBalance = playerBalance
        let availableTickets = collectAvailableTickets(tickets.values())
        if (ticketCount > 0 || availableTickets.length === 0) {
            const purchaseCount = ticketCount ?? 1
            console.log('launcher', 'buyTicket - purchaseCount', purchaseCount)
            newBalance = roundHalfEven(playerBalance - TICKET_COST * purchaseCount)
            setPlayerBalance(newBalance)
            for (let i = 0; i < purchaseCount; i++) {
                const ticket = mockTicket(gameId)
                tickets.set(ticket.ticketId, ticket)
            }
        } else {
            console.log('launcher', 'buyTicket - return earlier purchase')
        }

        availableTickets = collectAvailableTickets(tickets.values())
        const ticket = {...availableTickets[0],
            remainingTickets: availableTickets.length - 1,
            balance: newBalance
        }

        tickets.get(ticket.ticketId).played = true
        return ticket
    }

    const collectAvailableTickets = (ticketList) => {
        const availableTickets = []
        for (const t of ticketList) {
            if (!t.played)
                availableTickets.push(t)
        }
        return availableTickets
    }

    const mockTicket = (gameId) => {
        return {
            gameId: gameId,
            ticketId: Math.round(Math.random() * 1000000),
            ticketCost: TICKET_COST,
            outcomes: [500, 979, 999, 1000],
            payouts: [0, 1, 3, 75],
            rng: Math.round(Math.random() * 999) + 1,
            played: false
        }
    }

    const addToPlayerBalance = useCallback((change) => {
        const newBalance = roundHalfEven(playerBalance + change)
        setPlayerBalance(newBalance)

        console.log('launcher', `balanceChange(${newBalance})`)
        sendBalanceToGameUi(newBalance)
    }, [playerBalance])

    const ticketValue = (ticket) => {
        const resultInd = ticket.outcomes.findIndex((value) => { // 0, 1, 2, 3
            return ticket.rng <= value
        })
        return ticket.payouts[resultInd]
    }

    /** Claim the prize for a game on the blockchain */
    const claimPrize = (gameId, ticketId) => {
        console.log('launcher', `claimPrize(gameId: ${gameId}, ticketId: ${ticketId})`)

        const ticket = tickets.get(ticketId)
        if (ticket['claimed'])
            return

        const value = ticketValue(ticket)
        if (value)
            addToPlayerBalance(value)
        ticket['claimed'] = true
    }

    /** Save the game and ticket specific progress information */
    const saveGameProgress = (gameId, ticketId, data) => {
        console.log('launcher', 'saveGameProgress', gameId, ticketId, data)
    }

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

    window.onmessage = function (e) {
        if (e.data?.action === 'buyTicket') {
            const ticket = buyTicket(e.data?.gameId, e.data?.ticketCount)

            sendTicketToGameUi(ticket)
        } else if (e.data?.action === 'claimPrize') {
            claimPrize(e.data?.gameId, e.data?.ticketId)
        } else if (e.data?.action === 'saveGameProgress') {
            saveGameProgress(e.data?.gameId, e.data?.ticketId, e.data?.data)
        } else if (e.data?.action === 'readyToPlay') {
            readyToPlay(gameId)
        }
    }

    const readyToPlay = (gameId) => {
        console.log('launcher', 'readyToPlay')

        // generate new ticket if the clicked one is already played
        sendTicketToGameUi(buyTicket(gameId, 3))
    };

    const gameSizeChanged = useCallback(() => {
        const gameFrame = iframeRef.current
        const newHeight = gameFrame.contentWindow.document.body.scrollHeight
            + parseInt(getComputedStyle(gameFrame).marginTop)
            + parseInt(getComputedStyle(gameFrame).marginBottom)
        gameFrame.height = newHeight + "px"
    }, [iframeRef])

    const launcherSizeChanged = useCallback(() => {
        const gameFrame = iframeRef.current
        gameFrame.style.aspectRatio = "" + window.innerWidth / window.innerHeight
        gameFrame.height = ""
    }, [iframeRef])

    useEffect(() => {
        const gameFrame = iframeRef.current
        gameFrame.contentWindow.onresize = gameSizeChanged
        window.onresize = launcherSizeChanged
        return () => {
            window.onresize = null
        }
    }, [iframeRef, gameSizeChanged, launcherSizeChanged])

    const roundHalfEven = (n) => {
        return Math.round(n*100)/100;
    }

    return (
        <div>
            <iframe
                ref={iframeRef}
                onLoad={launcherSizeChanged}
                id="gameFrame"
                src="game/index.html"
                title="Game"
                height={height}
                scrolling="no"
                frameBorder="0"
                style={{
                    width: "100%",
                    overflow: "hidden",
                    border: "none"
                }}
            ></iframe>
        </div>
    )
}
