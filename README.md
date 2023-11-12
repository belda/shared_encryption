# Shared QR Encryption
Shamir shared secrets with QR codes run only in browser.

## What is this?
This is a simple tool for sharing secrets with multiple people.
[Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing) is a method for splitting a secret, like a password, into pieces.
Imagine a secret is a puzzle, and you give each trusted person a piece. Only when a certain number of these pieces are put together, the secret is revealed. This ensures that no single person can access the secret alone.

This tool allows you to split a secret into pieces, and then encode each piece as a QR code. You can then print these QR codes and distribute them to your trusted people. When you need to access the secret, you can scan the QR codes and the secret will be revealed.

## Why?

There are scenarios where having only 1 key to decrypt a message is not sufficient and at the same time
splitting the keys in half might pose risk of loosing such a key.
For example, you want to encrypt a message and give the decryption key to your family members.
You want to make sure that if one of them loses the key, the message is still accessible.
But you don't want to have to collect all the keys every time you want to decrypt the message and at the same time
you don't want to have to trust any single person with the key.

## How safe is this?
- The secret is encrypted using [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) with a random key
- The key is then split using Shamir's Secret Sharing into multiple pieces. It has [Information-theoretic security](https://en.wikipedia.org/wiki/Information-theoretic_security)
- The QR codes contain the whole encrypted message, only enough keys are required
- **Nothing is stored on the server!** This app runs locally and no webserver is logging the keys (hashtag part of url)


## How to use
Easiest is to use the hosted version at https://belda.github.io/shared_encryption/.
Or you can just clone the repo and open `index.html` in your browser.


## License
MIT
