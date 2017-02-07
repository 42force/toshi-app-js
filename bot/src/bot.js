const SOFA = require('token-headless-bot').SOFA;
const Bot = require('token-headless-bot').Bot;

let bot = new Bot();

function sendEth(session, value) {
  session.reply(SOFA.Payment({
    status: "unverified",
    value: value,
    txHash: '0x0'
  }));
}


bot.hear('SOFA::PaymentRequest:', (session, message) => {
  let value = parseInt(message.content.value.slice(2), 16);
  if (value < 1000000000000000000) {
    session.reply("Ok! I'll send you some cash.")
    if (session.get('human')) {
      sendEth(session, message.content.value)
    } else {
      session.set('ethRequestPendingCaptcha', message.content.value)
      session.openThread('captcha')
    }
  } else {
    session.reply("Way too much. If you ask for something more like $1 maybe we can talk.");
  }
})


bot
  .thread('captcha')
  .onOpen = (session) => {
    session.reply("I need you to prove you're human. Type the numbers below:")
    session.reply("123")
    session.set('captcha', '123')
    session.set('captcha_attempts', 3)
    session.setState('awaiting_captcha_solve')
  }


bot
  .thread('captcha')
  .state('awaiting_captcha_solve')
  .hear('SOFA::Message:', (session, message) => {
    console.log(message.content.body)
    console.log(session.get('captcha'))
    if (message.content.body == session.get('captcha')) {
      session.set('human', true)
      session.reply('Correct!')
      sendEth(session, session.get('ethRequestPendingCaptcha'))
      session.closeThread()
    } else {
      if (session.get('captcha_attempts') > 0) {
        session.set('captcha_attempts', session.get('captcha_attempts')-1)
        session.reply('Incorrect, try again')
      } else {
        session.reply('Too many failures. #bye')
        session.closeThread()
      }
    }
  })



bot.hear('ping', (session, message) => {
  session.reply(SOFA.Message({body: "pong"}));
})

bot.hear('reset', (session, message) => {
  session.reset()
  session.reply(SOFA.Message({body: "I've reset your state."}));
})

bot.hear('SOFA::Init:', (session, message) => {
  session.reply("I will pay you at "+message.content.paymentAddress+" and speak to you in "+message.content.language);
})

bot.hear('SOFA::Payment:', (session, message) => {
  session.reply("Thanks for the loot.");
})

bot.hear('SOFA::PaymentRequest:', (session, message) => {
  session.reply("I ain't paying you a dime.");
})

bot.hear('initMe', (session, message) => {
  session.reply(SOFA.InitRequest({
    values: ['paymentAddress', 'language']
  }));
})

bot.hear('begMe', (session, message) => {
  session.reply(SOFA.PaymentRequest({
    body: "Thanks for the great time! Can you send your share of the tab?",
    value: "0xce0eb154f900000",
    destinationAddress: "0x056db290f8ba3250ca64a45d16284d04bc6f5fbf"
  }));
})

bot.hear('SOFA::Command:', (session, message) => {
  session.reply("I was commanded: ", message.content.value);
})

bot.hear('buttons', (session, message) => {
  session.reply(SOFA.Message({
    body: "Now let’s try sending some money. Choose a charity to make a donation of $0.01.",
    controls: [
      {type: "button", label: "Red Cross", value: "red-cross"},
      {type: "button", label: "Ethereum foundation", value: "ethereum-foundation"},
      {type: "button", label: "GiveWell.org", value: "givewell.org"},
      {type: "button", label: "Not now, thanks", value: null}
    ]
  }));
})

bot.hear('groups', (session, message) => {
  session.reply(SOFA.Message({
    body: "What would you like me to do for you right now?",
    controls: [
      {
        type: "group",
        label: "Trip",
        controls: [
          {type: "button", label: "Directions", action: "Webview:/Directions"},
          {type: "button", label: "Timetable", value: "timetable"},
          {type: "button", label: "Exit Info", value: "exit"},
          {type: "button", label: "Service Conditions", action: "Webview:/ServiceConditions"}
        ]
      },{
        type: "group",
        label: "Services",
        controls: [
          {type: "button", label: "Buy Ticket", action: "buy-ticket"},
          {type: "button", label: "Support", value: "support"}
        ]
      },
      {type: "button", label: "Nothing", value: -1}
    ],
    showKeyboard: false
  }));
})


bot.hear('SOFA::Message:', (session, message) => {
  session.reply("I hear you "+session.address);
});