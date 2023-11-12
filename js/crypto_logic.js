//Javascipt for the crypto page and control of tabs

function openTab(evt, tabName=null) {
    var i, tabcontent, tablinks;
    if (tabName == null) {
        tabName = $(evt.target).data("target");
        console.info(tabName);
    }
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    window.location.hash = tabName;
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


function decryptAction() {
    var encrypted_message = localStorage.getItem("encrypted");
    console.log("encrypted_message: " + encrypted_message);
    if (!encryptedMessage) {
        alert("Encrypted message is empty or not present. You need to load the encrypted message and the minimum number of keys.");
        return;
    }

    var shares = getLocalStorageSet("keys");
    console.log("shares: ", shares);
    if (shares.length == 0) {
        alert("You have not loaded any decryption key.")
    }

    try {
        var recoveredKey = recoverKey(shares);
        console.log("recoveredKey: " + recoveredKey);
        var decryptedMessage = decryptMessage(encrypted_message, recoveredKey);
        console.log("Decrypted Message:", decryptedMessage);
        if (!decryptedMessage) {
            alert("Decrypted message is empty. Please check, that you have the required amount of keys, that you have the decryption message and that you are trying to decrypt only 1 message at a time. ");
        }
    } catch (e) {
        console.log(e);
        alert("Problem decrypting message. Please check, that you have the required amount of keys, that you have the decryption message and that you are trying to decrypt only 1 message at a time.\n "+e);
    }
    $("#decryptedMessage").text(decryptedMessage);

}

function reset() {
    localStorage.clear();
    $("#num_loaded_keys").text(0);
    $("#encryptedMessage, #key").val("");
    window.location.hash = "";
}

$(document).ready(function() {

    initializeLocalStorageSet("keys");
    // Function to handle URL fragment and push it into local storage array of keys
    if (window.location.hash) {
        const data = parseFragmentParameters(window.location.hash);
        if (data.message && data.key_share) {
            localStorage.setItem("encrypted", data.message);
            addToLocalStorageSet("keys", data.key_share);
            openTab("decryptionSection");
        }
    }

    $(".tablinks").click(openTab);
    $(".tablinks[data-target=AboutSection]").click();


    $("#generateQR").click(function() {
      var encrypted_message = encryptMessage($('#message').val());
      var num_shares = $('#shares').val()*1;
      var threshold = $('#threshold').val()*1;
      var shares = createShares(encrypted_message.key, num_shares, threshold);

      console.log("Encrypted message: " + encrypted_message.combined, "Key: " + encrypted_message.key);
      $("#encoded_data").text("");
      $("#encoded_data").append($("<p>Encrypted Message: </p><textarea class='messageinput' disabled>" + encrypted_message.combined + "</textarea>"));

      for (var i = 0; i < shares.length; i++) {
        console.log("Share " + i + ": " + shares[i]);
        $("#encoded_data").append($("<h4>Share " + i + ": <span>" + shares[i] + "</span></h4>"));
        console.log(build_url(encrypted_message.combined, shares[i]));
        add_qr_code_to_page(build_url(encrypted_message.combined, shares[i]));
      }

    });

    $("#num_loaded_keys").text(getLocalStorageSet("keys").length);

    if (localStorage.getItem("encrypted")) {
        $("#encryptedMessage").val(localStorage.getItem("encrypted"));
    }

    $("#decrypt").click( decryptAction );

    $("#loadKey").click(function() {
        var share = $("#key").val();
        addToLocalStorageSet("keys", share);
        $("#num_loaded_keys").text(getLocalStorageSet("keys").length);

        if ($("#encryptedMessage").val() != "") {
            localStorage.setItem("encrypted", $("#encryptedMessage").val());
        }
    });

    $("#resetKey").click(reset);
});

