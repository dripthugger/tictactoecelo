import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import Transactions from "../contract/Transactions.abi.json";
import TICTACTOENFT from "../contract/tictactoenft.abi.json";

const ERC20_DECIMALS = 18;

const transactions_address = "0xc91b4c6206c18300aAbF8C2C60EE41fd5A3e96d2";
const nft_address = "0x6CDb04E6837B2b322E2D15D86d3793F84f47f41F";

const web3 = new Web3(window.celo);

let contract,
  kit,
  nft_contract,
  win_hashes = [];

console.log('main.js')

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

// If user wins, reward him with 0.1 CELO
$("body").on('DOMSubtreeModified', "#messages", function () {
  if ($('#messages').attr('status') === 'winner') {
    rewardUser($('#messages').attr('history'));
  }
});


const loadAchievements = async function () {
  let address = kit.defaultAccount.toString();
  $.ajax({
    url: `http://localhost:5000/minted?address=${address}`,
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
              url: `http://localhost:5000/save_mint/?address=${address}&wins_count=${wins_count}&token_id=${token_id}`,
              dataType: 'json',
              success: function (json) { }
            });
            window.location.href = window.location.href;
          });
      })
    }
  });
}

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();

      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();

      kit.defaultAccount = accounts[0];

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

// proceed to the next step button
$(document).ready(function () {
  $("button.proceed").click(function (event) {
    let pname = $(".name option:selected").val();
    let psize = $("#size option:selected").val();
    let pcrust = $("#crust option:selected").val();
    let ptopping = [];
    let totalAmount = 0;
    $.each($("input[name='toppings']:checked"), function () {
      ptopping.push($(this).val());
    });

    switch (psize) {
      case "large":
        price = 2.0;
        break;
      case "medium":
        price = 1.5;
        break;
      case "small":
        price = 1.0;
        break;
      default:
        price = 0;
    }

    switch (pcrust) {
      case "Crispy":
        crust_price = 0.5;
        break;
      case "Stuffed":
        crust_price = 0.5;
        break;
      case "Gluten-free":
        crust_price = 0.3;
        break;
      default:
        crust_price = 0;
    }

    let topping_value = (ptopping.length * 10.0) / 100.0;

    if (pname == "none" || psize == "none" || pcrust == "none") {
      $("button.proceed").show();
      $("#information").show();
      $("div.choise").hide();
      alert("Please select pizza size and crust");
    } else {
      $("button.proceed").hide();
      $("#information").hide();
      $("div.choise").slideDown(1000);
    }

    total = price + crust_price + topping_value;

    let checkoutTotal = 0;

    checkoutTotal = checkoutTotal + total;

    $("#pizzaname").html($(".name option:selected").val());
    $("#pizzasize").html($("#size option:selected").val());
    $("#pizzacrust").html($("#crust option:selected").val());
    $("#pizzatopping").html(ptopping.join(", "));
    $("#totals").html(total.toFixed(2));

    var currentId = userOrders.length;
    var newOrder = new Pizza(
      currentId,
      pname,
      psize,
      pcrust,
      ptopping,
      new BigNumber(total.toFixed(2)).shiftedBy(ERC20_DECIMALS).toString()
    );

    currentOrders.push(newOrder);

    // Addition of pizza button
    $("button.addPizza").click(function () {
      let pname = $(".name option:selected").val();
      let psize = $("#size option:selected").val();
      let pcrust = $("#crust option:selected").val();
      let ptopping = [];
      $.each($("input[name='toppings']:checked"), function () {
        ptopping.push($(this).val());
      });

      switch (psize) {
        case "large":
          price = 2.0;
          break;
        case "medium":
          price = 1.5;
          break;
        case "small":
          price = 1.0;
          break;
        default:
          price = 0;
      }

      switch (pcrust) {
        case "Crispy":
          crust_price = 0.5;
          break;
        case "Stuffed":
          crust_price = 0.5;
          break;
        case "Gluten-free":
          crust_price = 0.3;
          break;
        default:
          crust_price = 0;
      }

      let topping_value = (ptopping.length * 10.0) / 100.0;

      total = price + crust_price + topping_value;

      checkoutTotal = checkoutTotal + total;

      var nextId = currentOrders[currentOrders.length - 1].id;
      // constructor function
      var newOrder = new Pizza(
        nextId + 1,
        pname,
        psize,
        pcrust,
        ptopping,
        new BigNumber(total.toFixed(2)).shiftedBy(ERC20_DECIMALS).toString()
      );

      currentOrders.push(newOrder);

      $("#ordersmade").append(
        '<tr><td id="pizzaname">' +
        newOrder.name +
        '</td><td id="pizzasize">' +
        newOrder.size +
        '</td><td id="pizzacrust">' +
        newOrder.crust +
        '</td><td id="pizzatopping">' +
        newOrder.toppings.join(", ") +
        '</td><td id="totals">' +
        new BigNumber(newOrder.total).shiftedBy(-ERC20_DECIMALS).toFixed(2) +
        "</td></tr>"
      );
    });

    // Checkout button
    $("button#checkout").click(function () {
      $("button#checkout").hide();
      $("button.addPizza").hide();
      $(".pizzatable").hide();
      $(".choise h2").hide();
      $(".delivery").slideDown(1000);
      totalAmount = checkoutTotal + 0.2;
      $("#totalbill").append(
        "Your bill plus delivery fee is: " +
        totalAmount.toFixed(2) +
        " CELO." +
        " Delivery fee 0.2 CELO"
      );
    });

    // when one clicks place order button
    $("button#final-order").click(async function (event) {
      event.preventDefault();
      $(".delivery").hide();
      $("button#final-order").hide();
      let person = $("input#name").val();
      let phone = $("input#phone").val();
      let location = $("input#location").val();

      if (
        $("input#name").val() &&
        $("input#phone").val() &&
        $("input#location").val() != ""
      ) {
        $("#paymentmessage").append("Please confirm payment on wallet");
        $("#paymentmessage").slideDown(1200);

        notification(`⌛ Placing your orders...`);

        let result = await placeUserOrders(
          currentOrders,
          person,
          location,
          phone.toString(),
          totalAmount.toFixed(2)
        );

        if (result) {
          notification(`🎉 Order placed successfully".`);
          $("#finallmessage").append(
            "Hello " +
            person +
            ", We have recieved your order and it will be delivered to you at " +
            location +
            " thanks for ordering at PizzaPap"
          );
          $("#totalbill").hide();
          $("#paymentmessage").hide();
          $("#finallmessage").slideDown(1200);
        } else {
          $("#finallmessage").append(
            "Sorry " +
            person +
            " order not placed successfully " +
            " please try again."
          );
          $("#paymentmessage").hide();
          $("#totalbill").hide();
          $("#finallmessage").slideDown(1200);
        }
      } else {
        alert("Please fill in the details for delivery!");
        $(".delivery").show();
        $("button#final-order").show();
      }
    });
    event.preventDefault();
  });

  $('#deposit_contract').click(function (event) {
    depositToContract($('input#deposit_contract_input')[0].value);
  })
});

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
    url: `http://localhost:5000/save_tx/?address=${address}&txhash=${txhash}`,
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
    url: `http://localhost:5000/winner_hashes/?address=${address.toLowerCase()}`,
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

            let input = web3.utils.toAscii(json.result.input),
              game_result = (input.match(".*([O|X][O|E|X]{9}).*")[1])
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

  if (window.location.pathname == '/profile.html') {
    await getContractAddressAndBalance();

    await loadWins();
  }

  setTimeout(notificationOff(), 5000);
};
