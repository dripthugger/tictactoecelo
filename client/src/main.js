import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import Transactions from "../contract/Transactions.abi.json";
import TICTACTOENFT from "../contract/tictactoenft.abi.json";

const ERC20_DECIMALS = 18;

// contract address to work with transactions(deposit, withdraw funds...)
const transactions_address = "0xc91b4c6206c18300aAbF8C2C60EE41fd5A3e96d2";

// contract address to manipulate with nft's
const nft_address = "0x6CDb04E6837B2b322E2D15D86d3793F84f47f41F";

// Server domain, if it is local, it would be http://localhost:5000
const domain_ = "https://tictactoeserver-production-01f3.up.railway.app";

const web3 = new Web3(window.celo);

let contract,
  kit,
  nft_contract,
  win_hashes = [];


// Notification function, pops up in boostrap alert block
function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

// Turns off current notifications
function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

// If user wins, reward him with 0.1 CELO
$("body").on('DOMSubtreeModified', "#messages", function () {
  if ($('#messages').attr('status') === 'winner') {
    rewardUser($('#messages').attr('history'));
  }
});

// Load achievements to the user's profile
const loadAchievements = async function () {
  let address = kit.defaultAccount.toString();
  $.ajax({
    // Every achievement is an NFT, so we gonna check if user got special nft
    url: `${domain_}/minted?address=${address}`,
    dataType: 'json',
    crossDomain: true,
    success: function (json) {
      if (win_hashes.length >= 5) {
        if (!json.result["5"])
          $('.card.wins_5 .card-body').append('<button class="btn btn-primary claim_nft_win" value="5">Claim</button>');
        else
          $('.card.wins_5 .card-body').append('<button class="btn btn-dark" style="pointer-events: none;">Claimed</button>');
      } else {
        $('.card.wins_5 .card-body').append('<button class="btn btn-light" style="pointer-events: none;">Need more wins</button>');
      }

      if (win_hashes.length >= 10) {
        if (!json.result["10"])
          $('.card.wins_10 .card-body').append('<button class="btn btn-primary claim_nft_win" value="10">Claim</button>');
        else
          $('.card.wins_10 .card-body').append('<button class="btn btn-dark" style="pointer-events: none;">Claimed</button>');
      } else {
        $('.card.wins_10 .card-body').append('<button class="btn btn-light" style="pointer-events: none;">Need more wins</button>');
      }

      $("button.claim_nft_win").on('click', async function () {
        let wins_count = $(this).attr('value');
        console.log(nft_contract)
        await nft_contract.methods.safeMint(kit.defaultAccount, wins_count)
          .send({ from: kit.defaultAccount })
          .then(async function (receipt) {
            // ID of minted NFT
            let token_id = receipt.events.Transfer.returnValues.tokenId;
            // Saving ID on the server
            $.ajax({
              url: `${domain_}/save_mint/?address=${address}&wins_count=${wins_count}&token_id=${token_id}`,
              dataType: 'json',
              success: function (json) { }
            });
            window.location.href = window.location.href;
          });
      })
    }
  });
}

// Connection of user's wallet
const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();

      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();

      kit.defaultAccount = accounts[0];

      // If user successfully connected,redirect him to game page
      if (window.location.pathname === '/')
        window.location.href = '/game.html';
      else
        document.querySelector("#msgaddress").textContent = kit.defaultAccount;

      // Create an object of transaction contract
      contract = new kit.web3.eth.Contract(Transactions, transactions_address);

      nft_contract = new kit.web3.eth.Contract(TICTACTOENFT, nft_address);

    } catch (error) {
      if (window.location.pathname !== '/')
        window.location.href = '/';
    }
  } else {
    if (window.location.pathname !== '/')
      window.location.href = '/';
  }
};

const getBalance = async function () {
  notification("⌛ Getting User Balance...");
  try {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount);

    const CELOBalance = totalBalance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(2);
    document.querySelector("#balance").textContent = CELOBalance + " CELO";
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }

};

/*  Reward user method
    calls withdraw() contract method 
*/
const rewardUser = async function (history) {
  notification("Please, confirm reward in your wallet");
  let amount = 0.1 * Math.pow(10, 18);
  await contract.methods.withdraw(kit.defaultAccount.toString(), amount.toString(), history)
    .send({ from: kit.defaultAccount.toString() })
    .then(async function (receipt) {
      notification("Waiting for contract confirmations");
      await writeUserWin(receipt.from, receipt.transactionHash);

      window.location.href = window.location.href;
    });
}

/*  User deposit to contract method
    User always can help the project to reward users
*/
const depositToContract = async function (amount) {
  notification("Depositing to contract..");
  if (amount) {
    amount = amount * Math.pow(10, 18)
    contract.methods.deposit().send({ from: kit.defaultAccount, value: amount }).then(function (receipt) {
      window.location.href = window.location.href;
    });
  }
  notificationOff();
}

// Getting contract's balance and address to show to user
const getContractAddressAndBalance = async function () {
  notification("⌛ Getting Contract address...");
  try {
    let address = await contract.methods
      .getAddress()
      .call();
    let balance = await contract.methods
      .getBalance()
      .call();
    $('#contract_address').text(address)
    $('#contract_balance').text(`${balance / Math.pow(10, 18)} CELO`)
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
};

// Sending get request to the server to save user's win hash
const writeUserWin = async function (address, txhash) {
  $.ajax({
    url: `${domain_}/save_tx/?address=${address}&txhash=${txhash}`,
    dataType: 'json',
    success: function (json) {
      console.log(json.result)
    }
  });
}

const loadWins = async function () {
  notification("⌛ Loading wins...");
  let address = kit.defaultAccount.toString();
  $.ajax({
    url: `${domain_}/winner_hashes/?address=${address.toLowerCase()}`,
    dataType: 'json',
    crossDomain: true,
    success: function (json) {
      let wins_ = [],
        loop_counter = 0;

      win_hashes = JSON.parse(json.result).reverse();

      notification("⌛ Loading achievements...");

      loadAchievements();

      $('span#wins_count').text(win_hashes.length)
      win_hashes.forEach(element => {
        $.ajax({
          url: `https://explorer.celo.org/alfajores/api?module=transaction&action=gettxinfo&txhash=${element}`,
          dataType: 'json',
          success: function (json) {
            // Decode transaction input array to get wins history
            let input = web3.utils.toAscii(json.result.input),
              game_result = (input.match(".*([O|X][O|E|X]{9}).*")[1])
            /* 
            Make array of wins
            And we do not really need a timestamp, because transactions are already sorted
            */
            wins_.push({
              'hash': json.result.hash,
              'timestamp': json.result.timeStamp,
              'result': game_result
            });

            loop_counter++;
            if (loop_counter === win_hashes.length)
              renderWins(wins_);
          }
        });
      });

      notificationOff();
    }
  });
}

// Rendering tic tac toe cells for all of user's wins
const renderWins = async function (data) {
  data.forEach(element => {
    let user_point = element.result[0],
      results = element.result;

    $('#wins_history').append(`
      <div class="card" style="width: 100%;">
        <div class="card-body">
          <a target="_blank" href="https://explorer.celo.org/alfajores/tx/${element.hash}">
            <h6 class="card-title">${element.hash}</h6>
          </a>
          <p class="card-text">
            <div class="row justify-content-center">
              <div class="col col-md-6 align-self-center">
                <div class="board">
                  <button id="a0" style="${results[1] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[1] !== 'E' ? results[1] : ' '}
                  </button> 
                  <button id="a1" style="${results[2] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[2] !== 'E' ? results[2] : ' '}
                  </button> 
                  <button id="a2" style="${results[3] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[3] !== 'E' ? results[3] : ' '}
                  </button>
                  <button id="b0" style="${results[4] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[4] !== 'E' ? results[4] : ' '}
                  </button> 
                  <button id="b1" style="${results[5] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[5] !== 'E' ? results[5] : ' '}
                  </button> 
                  <button id="b2" style="${results[6] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[6] !== 'E' ? results[6] : ' '}
                    </button>
                  <button id="c0" style="${results[7] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[7] !== 'E' ? results[7] : ' '}
                  </button> 
                  <button id="c1" style="${results[8] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[8] !== 'E' ? results[8] : ' '}
                  </button> 
                  <button id="c2" style="${results[9] === user_point ? 'background-color:lightgreen;' : ''}">
                    ${results[9] !== 'E' ? results[9] : ' '}
                  </button>

                </div>
              </div>
            </div>
          </p>
        </div>
      </div>
    `)
  })
}

window.onload = async () => {

  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();

  /* 
    If user is on the profile page, receiving
    transactions contract address and balance, and user's win history
  */
  if (window.location.pathname == '/profile.html') {
    await getContractAddressAndBalance();

    await loadWins();
  }

  // User click on deposit to contract button event
  $('#deposit_contract').click(function () {
    depositToContract($('input#deposit_contract_input')[0].value);
  })

  setTimeout(notificationOff(), 5000);
};
