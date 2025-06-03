// {
//     name: '',           // Identifiant unique du son
//     type: '',           // Type de son (music, voice, effect, ambient)
//     path: '',           // Chemin vers le fichier audio
//     options: {          // Options de lecture par défaut
//         loop: false,    // Si le son doit jouer en boucle
//         volume: 1.0,    // Volume par défaut (0.0 à 1.0)
//         spatial: false, // Si le son doit être spatialisé
//         maxDistance: 10 // Distance maximale d'audition pour les sons spatiaux
//     },
//     license: '',        // Licence du son
//     author: '',         // Auteur du son
//     url: ''            // URL source du son
// }

export default [
    // Musiques
    {
        name: 'background_intro',
        type: 'music',
        path: '/audio/musics/background_intro.mp3',
        options: {
            loop: true,
            volume: 0.5
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'aquarium',
        type: 'music',
        path: '/audio/musics/aquarium.mp3',
        options: {
            loop: true,
            volume: 0.5
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'corridor_ambiance',
        type: 'music',
        path: '/audio/musics/corridor_ambiance.mp3',
        options: {
            loop: true,
            volume: 2
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'pub',
        type: 'music',
        path: '/audio/musics/1_PUB.mp3',
        options: {
            loop: false,
            volume: 0.5
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'aquaturtles',
        type: 'music',
        path: '/audio/musics/aquaturtles.mp3',
        options: {
            loop: true,
            volume: 0.2
        },
        license: 'just kindness',
        author: 'A World Of Madness',
        url: 'https://youtu.be/fpGv8NWzlpw?si=p3oB_KJzGCTvkP3R'
    },
    {
        name: 'aquaturtles_creepy',
        type: 'music',
        path: '/audio/musics/aquaturtles_creepy5.mp3',
        options: {
            loop: true,
            volume: 0.5
        },
        license: '',
        author: 'A World Of Madness - Mathis Viollet Remix',
        url: ''
    },
    {
        name: 'boat',
        type: 'music',
        path: '/audio/musics/boat.mp3',
        options: {
            loop: true,
            volume: 0.2
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'suspense',
        type: 'music',
        path: '/audio/musics/suspense.mp3',
        options: {
            loop: true,
            volume: 1
        },
        license: '',
        author: '',
        url: ''
    },
    // Voice
    {
        name: '1_INTRO',
        type: 'voice',
        path: '/audio/voices/1_INTRO.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/1_INTRO.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '2.1_CHOIX1',
        type: 'voice',
        path: '/audio/voices/2.1_CHOIX1.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/2.1_CHOIX1.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '2.2_CHOIX2',
        type: 'voice',
        path: '/audio/voices/2.2_CHOIX2.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/2.2_CHOIX2.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '3.1_VOUSAVEZHATE',
        type: 'voice',
        path: '/audio/voices/3.1_VOUSAVEZHATE.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/3.1_VOUSAVEZHATE.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '3.2_CHOIX1',
        type: 'voice',
        path: '/audio/voices/3.2_CHOIX1.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/3.2_CHOIX1.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '3.3_CHOIX2',
        type: 'voice',
        path: '/audio/voices/3.3_CHOIX2.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/3.3_CHOIX2.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '4_CONNEXION',
        type: 'voice',
        path: '/audio/voices/4_CONNEXION.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/4_CONNEXION.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '5.1_DAUPHINS',
        type: 'voice',
        path: '/audio/voices/5.1_DAUPHINS.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/5.1_DAUPHINS.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '5.2_CHOIX1',
        type: 'voice',
        path: '/audio/voices/5.2_CHOIX1.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/5.2_CHOIX1.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '5.3_CHOIX2',
        type: 'voice',
        path: '/audio/voices/5.3_CHOIX2.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/5.3_CHOIX2.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '5.4_FINDAUPHIN',
        type: 'voice',
        path: '/audio/voices/5.4_FINDAUPHIN.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/5.4_FINDAUPHIN.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '6.1_PUB',
        type: 'voice',
        path: '/audio/voices/6.1_PUB.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/6.1_PUB.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '6.2_VIDEO',
        type: 'voice',
        path: '/audio/voices/6.2_VIDEO.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/6.2_VIDEO.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '6.3_NARRATEURINCOMPREHENSION',
        type: 'voice',
        path: '/audio/voices/6.3_NARRATEURINCOMPREHENSION.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/6.3_NARRATEURINCOMPREHENSION.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '6.4_CHOIX1',
        type: 'voice',
        path: '/audio/voices/6.4_CHOIX1.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/6.4_CHOIX1.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '6.5_CHOIX2',
        type: 'voice',
        path: '/audio/voices/6.5_CHOIX2.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/6.5_CHOIX2.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.1_TORTUES',
        type: 'voice',
        path: '/audio/voices/7.1_TORTUES.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/7.1_TORTUES.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.2_TORTUES',
        type: 'voice',
        path: '/audio/voices/7.2_TORTUES.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/7.2_TORTUES.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.3_VIDEO',
        type: 'voice',
        path: '/audio/voices/7.3_VIDEO.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/7.3_VIDEO.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.3.2_SEASHEPHERD',
        type: 'voice',
        path: '/audio/voices/7.3.2_SEASHEPHERD.mp3',
        options: {
            loop: false,
            volume: 1.0,
            vttSrc: 'audio/subtitles/7.3.2_SEASHEPHERD.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.4_VIDEO',
        type: 'voice',
        path: '/audio/voices/7.4_VIDEO.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/7.4_VIDEO.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.5_FAKENEWS',
        type: 'voice',
        path: '/audio/voices/7.5_FAKENEWS.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/7.5_FAKENEWS.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.5.2_SEASHEPHERD',
        type: 'voice',
        path: '/audio/voices/7.5.2_SEASHEPHERD.mp3',
        options: {
            loop: false,
            volume: 1.0,
            vttSrc: 'audio/subtitles/7.5.2_SEASHEPHERD.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '7.6_INTOX',
        type: 'voice',
        path: '/audio/voices/7.6_INTOX.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/7.6_INTOX.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.1_TELEPORTATION',
        type: 'voice',
        path: '/audio/voices/8.1_TELEPORTATION.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/8.1_TELEPORTATION.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.2_CHOIX1',
        type: 'voice',
        path: '/audio/voices/8.2_CHOIX1.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/8.2_CHOIX1.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.2.2_SEASHEPHERD',
        type: 'voice',
        path: '/audio/voices/8.2.2_SEASHEPHERD.mp3',
        options: {
            loop: false,
            volume: 1.0,
            vttSrc: 'audio/subtitles/8.2.2_SEASHEPHERD.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.3_PIRATAGE',
        type: 'voice',
        path: '/audio/voices/8.3_PIRATAGE.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/8.3_PIRATAGE.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.3.2_SEASHEPHERD',
        type: 'voice',
        path: '/audio/voices/8.3.2_SEASHEPHERD.mp3',
        options: {
            loop: false,
            volume: 1.0,
            vttSrc: 'audio/subtitles/8.3.2_SEASHEPHERD.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.4_LAFERME',
        type: 'voice',
        path: '/audio/voices/8.4_LAFERME.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/8.4_LAFERME.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.6_AGONIE',
        type: 'voice',
        path: '/audio/voices/8.6_AGONIE.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/8.6_AGONIE.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '8.7_DEFEAT',
        type: 'voice',
        path: '/audio/voices/8.7_DEFEAT.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/8.7_DEFEAT.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '9.1_SEASHEPHERD',
        type: 'voice',
        path: '/audio/voices/9.1_SEASHEPHERD.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/9.1_SEASHEPHERD.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '9.2_SEASHEPHERD',
        type: 'voice',
        path: '/audio/voices/9.2_SEASHEPHERD.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/9.2_SEASHEPHERD.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '9.3_SEASHEPHERD',
        type: 'voice',
        path: '/audio/voices/9.3_SEASHEPHERD.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/9.3_SEASHEPHERD.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: '9.4_OUTRO',
        type: 'voice',
        path: '/audio/voices/9.4_OUTRO.mp3',
        options: {
            loop: false,
            volume: 2.0,
            vttSrc: 'audio/subtitles/9.4_OUTRO.vtt'
        },
        license: '',
        author: '',
        url: ''
    },
    // Sfx
    {
        name: 'glitch__100',
        type: 'sfx',
        path: '/audio/sfx/glitch/100/0.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__101',
        type: 'sfx',
        path: '/audio/sfx/glitch/100/1.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__102',
        type: 'sfx',
        path: '/audio/sfx/glitch/100/2.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__200',
        type: 'sfx',
        path: '/audio/sfx/glitch/200/0.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__201',
        type: 'sfx',
        path: '/audio/sfx/glitch/200/1.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__202',
        type: 'sfx',
        path: '/audio/sfx/glitch/200/2.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__300',
        type: 'sfx',
        path: '/audio/sfx/glitch/300/0.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__301',
        type: 'sfx',
        path: '/audio/sfx/glitch/300/1.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__302',
        type: 'sfx',
        path: '/audio/sfx/glitch/300/2.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__400',
        type: 'sfx',
        path: '/audio/sfx/glitch/400/0.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__401',
        type: 'sfx',
        path: '/audio/sfx/glitch/400/1.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__402',
        type: 'sfx',
        path: '/audio/sfx/glitch/400/2.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__500',
        type: 'sfx',
        path: '/audio/sfx/glitch/500/0.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__501',
        type: 'sfx',
        path: '/audio/sfx/glitch/500/1.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__502',
        type: 'sfx',
        path: '/audio/sfx/glitch/500/2.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__600',
        type: 'sfx',
        path: '/audio/sfx/glitch/600/0.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__601',
        type: 'sfx',
        path: '/audio/sfx/glitch/600/1.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__602',
        type: 'sfx',
        path: '/audio/sfx/glitch/600/2.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'glitch__2000',
        type: 'sfx',
        path: '/audio/sfx/glitch/2000/2000.mp3',
        options: {
            loop: false,
            volume: 1.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'spot_boat',
        type: 'sfx',
        path: 'audio/sfx/spots/turn_on.mp3',
        options: {
            loop: false,
            volume: 10.0
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'door_open',
        type: 'sfx',
        path: 'audio/sfx/doors/open.mp3',
        options: {
            loop: false,
            volume: 1
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'door_close',
        type: 'sfx',
        path: '/audio/sfx/doors/close.mp3',
        options: {
            loop: false,
            volume: 1
        },
        license: '',
        author: '',
        url: ''
    },
    {
        name: 'end',
        type: 'music',
        path: '/audio/musics/end.mp3',
        options: {
            loop: true,
            volume: 1
        },
        license: '',
        author: '',
        url: ''
    }

        
] 