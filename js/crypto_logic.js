// JavaScript functions for encryption, decryption, and handling URL fragments

// Function to handle URL fragment and push it into local storage array of keys
window.onload = function() {
    initializeLocalStorageSet("keys");

    if (window.location.hash) {
        const data = parseFragmentParameters(window.location.hash);
        if (data.message && data.key_share) {
            localStorage.setItem("encrypted", data.message);
            addToLocalStorageSet("keys", data.key_share);
        }
    }
}


// Function to initialize the set in local storage
function initializeLocalStorageSet(key) {
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([])); // Store an empty array as the set
    }
}

// Function to add an item to the set
function addToLocalStorageSet(key, item) {
    // Deserialize the set from local storage
    let set = new Set(JSON.parse(localStorage.getItem(key)));

    // Add the item if it doesn't already exist
    if (!set.has(item)) {
        set.add(item);

        // Serialize the set back to local storage
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } else {
        console.log("Item already exists in the set");
    }
}

function getLocalStorageSet(key) {
    return JSON.parse(localStorage.getItem(key));
}

function parseFragmentParameters(hash) {
    // Parse the URL fragment parameters and return data
    // return parsed values as an object split by =
    var params = hash.substring(1).split('=');
    return {message : params[1], key_share : params[2]};
}

function build_url(message, share) {
    // get the current URL without the fragment after #
    var url = window.location.href.split('#')[0];
    // add the message and share to the URL fragment, ensure it won't contain any special characters
    return url + '#decryptionSection=' + encodeURIComponent(message) + '=' + share;
}


// Ensure secrets.js is loaded
if (typeof secrets === 'undefined') {
    throw new Error('secrets.js library is not loaded!');
}

function encryptMessage(message) {
    var key = CryptoJS.lib.WordArray.random(128 / 8); // Generate a 128-bit random key
    var iv = CryptoJS.lib.WordArray.random(128 / 8);  // Generate a 128-bit random IV

    var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(message), key, { iv: iv });

    // Combine the IV and encrypted message (both converted to hex string)
    var combined = iv.toString(CryptoJS.enc.Hex) + encrypted.ciphertext.toString(CryptoJS.enc.Hex);

    return { combined: combined, key: key.toString(CryptoJS.enc.Hex) };
}

function decryptMessage(combined, keyHex) {
    var ivHex = combined.substring(0, 32); // First 32 hex chars are the IV
    var encryptedHex = combined.substring(32); // The rest is the ciphertext

    var key = CryptoJS.enc.Hex.parse(keyHex);
    var iv = CryptoJS.enc.Hex.parse(ivHex);
    var encrypted = CryptoJS.enc.Hex.parse(encryptedHex);

    var decrypted = CryptoJS.AES.decrypt({ ciphertext: encrypted }, key, { iv: iv });

    return decrypted.toString(CryptoJS.enc.Utf8);
}

function createShares(keyHex, n, k) {
    return secrets.share(keyHex, n, k);
}

function recoverKey(shares) {
    return secrets.combine(shares);
}


function add_qr_code_to_page(url) {
    var qrcodeContainer = $("<div class='qr_code_container'></div>");
    $("#encoded_data").append(qrcodeContainer);
    new QRCode(qrcodeContainer[0], {
        text: url,
        width: 512, height: 512,
        correctLevel: QRCode.CorrectLevel.M
    } );

}



$(document).ready(function() {
  $("#generateQR").click(function() {
      var encrypted_message = encryptMessage($('#message').val());
      var num_shares = $('#shares').val()*1;
      var threshold = $('#threshold').val()*1;
      var shares = createShares(encrypted_message.key, num_shares, threshold);

      console.log("Encrypted message: " + encrypted_message.combined, "Key: " + encrypted_message.key);
      $("#encoded_data").append($("<p>Encrypted Message: " + encrypted_message.combined + "</p>"));

      for (var i = 0; i < shares.length; i++) {
        console.log("Share " + i + ": " + shares[i]);
        $("#encoded_data").append($("<h3>Share " + i + ": " + shares[i] + "</h3>"));
        add_qr_code_to_page(build_url(encrypted_message.combined, shares[i]));
      }

  });

  $("#num_loaded_keys").text(getLocalStorageSet("keys").length);

  if (localStorage.getItem("encrypted")) {
        $("#encryptedMessage").val(localStorage.getItem("encrypted"));
  }

  $("#decrypt").click(function() {
        var encrypted_message = localStorage.getItem("encrypted");
        console.log("encrypted_message: " + encrypted_message);
        var shares = getLocalStorageSet("keys");
        console.log("shares: ", shares);
        var recoveredKey = recoverKey(shares);
        console.log("recoveredKey: " + recoveredKey);
        var decryptedMessage = decryptMessage(encrypted_message, recoveredKey);
        console.log("Decrypted Message:", decryptedMessage);
        $("#decrypted_message").text(decryptedMessage);
  } );

  $("#loadKey").click(function() {
        var share = $("#key").val();
        addToLocalStorageSet("keys", share);
        $("#num_loaded_keys").text(getLocalStorageSet("keys").length);

        if ($("#encryptedMessage").val() != "") {
            localStorage.setItem("encrypted", $("#encryptedMessage").val());
        }
  });

  $("#resetKey").click(function (){
      localStorage.clear();
      $("#num_loaded_keys").text(0);
  });
});

