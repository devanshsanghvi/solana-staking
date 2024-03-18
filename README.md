# Staking Program Solana

## clone repo
git clone https://gitlab.com/Devansh-Sanghvi/solana-staking.git
cd solana-staking

## for generating new contract address
solana-keygen new -o ./target/deploy/staking_program_anchor-keypair.json -f

## setup new accounts
solana-keygen new -o ./admin-wallet.json
solana-keygen new -o ./user-wallet.json
solana-keygen new -o ./user-info.json
solana-keygen new -o ./pool-info.json

## airdrop SOL
solana airdrop 5 admin-wallet.json --url https://api.devnet.solana.com
solana airdrop 5 user-wallet.json --url https://api.devnet.solana.com

## build program
anchor build

## deploy program
anchor deploy -k admin-wallet.json --url https://api.devnet.solana.com

## install dependencies
yarn install

## test example
ts-node tests/example.ts
