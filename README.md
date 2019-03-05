# telegram_bot

Bot per telegram sviluppato in Node.js, le cui funzioni sono rivolte alla gestione di un gruppo di persone che hanno accesso ai contenuti
multimediali di un server Plex, e all'inserimento di nuovi contenuti basato sulle richieste (bookmark) degli utenti che vi hanno accesso.

Le funzionalita' sono supportate dal database NoSQL Firebase per quanto riguarda il salvataggio dei bookmark degli utenti e il loro recupero
e aggiornamento, e da richieste API a Open Movie Database, Radarr e Sonarr (programmi ausiliari di gestione locali sul server)

Le funzionalita' per gli utenti sono:

inline query: usa @ana_t_bot + titolo di quello che vuoi cercare, e scegli tra i risultati. Clicca Bookmark it! 
                sotto il risultato selezionato per aggiungerlo
/getlist: uso /getList (anime,movies,tv), restituisce una lista completa degli elementi presenti per categoria
/searchfilm, /searchtv, /searchanime (ricerca), restituisce i match alla keyword nella categoria
/mybmks: restituisce una lista completa di tutti i bookmark personali salvati
/bot: link al bot per chat privata
/lsc: comando segreto#1 (da usare spesso)
/quality: lo stream è in bassa qualità-impiega troppo tempo in buffer? Leggi perchè e come risolvere!
/help: mostra tutti i comandi

Le funzionalita' esclusive per l'amministratore del server sono:

/accept (keyword): accetta la richiesta di un utente
/remove (keyword): rimuovi la richiesta di un utente
/sonarr (keyword): procedura di inserimento di serie tv e anime. Verranno mostrati i risultati derivanti dalla ricerca della keyword,
                   e sara' poi possibile scegliere tra i profili di qualita' e lingua impostati su Sonarr, su quale disco scaricare il
                   nuovo contenuto (visualizzando anche lo spazio disponibile su ogni disco)
/radarr (keyword): procedura di inserimento di film. Verranno mostrati i risultati derivanti dalla ricerca della keyword,
                   e sara' poi possibile scegliere tra i profili di qualita' e lingua impostati su Sonarr, su quale disco scaricare il
                   nuovo contenuto (visualizzando anche lo spazio disponibile su ogni disco)
