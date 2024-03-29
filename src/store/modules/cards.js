import api from "./../../axios";
import axios from "axios";

export default {
    actions: {
        fetchCards(context) {
            context.commit('loadingStatus', true)
            api.get('/cards')
                .then(res => {
                    context.commit('getCards', res.data.Items)
                    context.commit('loadingStatus', false)
                }).catch(async () => {
                context.commit('loadingStatus', false)
            })
        },
        createCard(context, params) {
            context.commit('loadingStatus', true)
            api.post('/createCard', JSON.stringify(params))
                .then(() => {
                    context.commit('addCard',
                        {
                            id: params.id,
                            title: params.title,
                            index: params.index,
                            description: params.description,
                            idCol: params.idCol,
                        })
                    context.commit('loadingStatus', false)
                }).catch(async () => {
                console.log('error')
                context.commit('loadingStatus', false)
            })
        },
        deleteCard(context, id) {
            context.commit('loadingStatus', true)
            api.delete('/deleteCard/' + id)
                .then(() => {
                    context.commit('deleteCard', id)
                    context.commit('loadingStatus', false)
                }).catch(async () => {
                console.log('error')
                context.commit('loadingStatus', false)
            })
        },
        updateCard(context, params) {
            context.commit('updateStatus', true)
            const body = {
                title: params.title,
                index: params.index,
                description: params.description,
                idCol: params.idCol,
            }
            api.put('/updateCard/' + params.id, JSON.stringify(body))
                .then(res => {
                    context.commit('updateCard', res.data.Attributes)
                    context.commit('updateStatus', false)
                }).catch(async () => {
                console.log('error')
                location.reload();
                context.commit('loadingStatus', false)
            })
        },
        async deleteFile(context, params) {
            context.commit('loadFile', {fileStatus: true, id: params.idCard})
            api.post('/deleteObject',
                JSON.stringify(params)).then(() => {
                context.commit('deleteFile', params)
                context.commit('loadFile', {fileStatus: false, id: params.idCard})
            })
        },
        async putFile(context, params) {
            context.commit('loadFile', {fileStatus: true, id: params.idCard})
            const body = {
                filename: params.filename,
                idCard: params.idCard
            };
            api.post('/putObject',
                JSON.stringify(body)).then(async res => {
                await axios.put(res.data.url, params.file)
                    .then(() => context.commit('loadFile', {fileStatus: false, id: params.idCard}));
                context.commit('putFile', params)
            })
        }
    },
    mutations: {
        loadFile(state, params) {
            state.s3loader = params.fileStatus
            state.fileCard = params.id
        },
        getCards(state, cards) {
            state.cards = cards;
        },
        addCard(state, card) {
            state.cards.push(card)
        },
        deleteCard(state, id) {
            state.cards = state.cards.filter(card => card.id !== id)
        },
        updateCard(state, params) {
            let updatedCol = state.cards.findIndex(item => item.id === params.id);
            state.cards[updatedCol].title = params.title;
            state.cards[updatedCol].index = params.index;
            state.cards[updatedCol].description = params.description;
            state.cards[updatedCol].idCol = params.idCol;
        },
        deleteFile(state, params) {
            let updatedCard = state.cards.findIndex(item => item.id === params.idCard);
            delete state.cards[updatedCard].file
        },
        putFile(state, params) {
            let updatedCard = state.cards.findIndex(item => item.id === params.idCard);
            state.cards[updatedCard].file = params.filename
        }
    },
    state: {
        s3loader: false,
        fileCard: 0,
        cards: [],
        changeCard: {},
        newCol: Number,
        oldCol: Number,
        newIndex: Number,
        oldIndex: Number,
    },
    getters: {
        allCards(state) {
            return state.cards
        },
        getCardsById: state => idCol => {
            return state.cards.filter(card => card.idCol === idCol).sort((a, b) => {
                if (+a.index > +b.index)
                    return 1;
                if (+a.index < +b.index)
                    return -1;
                // a должно быть равным b
                return 0;
            });
        },
        minCardIndex(state) {
            let min = +state.cards[0].index;
            for (let i in state.cards) {
                if (+state.cards[i].index < min)
                    min = +state.cards[i].index
            }
            return min;
        },
        newCardIndex(state) {
            if (state.cards.length === 0)
                return 0.001
            let max = +state.cards[0].index;
            for (let i in state.cards) {
                if (+state.cards[i].index > max)
                    max = +state.cards[i].index
            }
            return max + 0.00001;
        },
        getFileStatus(state) {
            return {status: state.s3loader, card: state.fileCard}
        }
    },
}