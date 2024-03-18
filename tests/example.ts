import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { StakingProgramAnchor } from "../target/types/staking_program_anchor";
const inquirer = require('inquirer');

async function main() {
  const NETWORK = "https://api.devnet.solana.com";
  const WALLET_PATH = "./admin-wallet.json";
  const USER_WALLET_PATH = "./user-wallet.json";
  const USER_INFO_PATH = "./user-info.json";
  const POOL_INFO_PATH = "./pool-info.json";

  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(WALLET_PATH, { encoding: "utf-8" })))
  );
  const wallet = new anchor.Wallet(admin);
  const connection = new Connection(NETWORK, 'confirmed');
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });

  const idl = JSON.parse(fs.readFileSync('./target/idl/staking_program_anchor.json', 'utf8'));
  const programId = new PublicKey('9DBuXggcjvwmJfNYR5qRxhN1jwLjJ46sdY7Fj9Qcuus2');
  const program = new anchor.Program(idl, programId, provider);

  const user = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(USER_WALLET_PATH, { encoding: "utf-8" })))
  );
  let userInfo = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(USER_INFO_PATH, { encoding: "utf-8" })))
  );
  const poolInfo = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(POOL_INFO_PATH, { encoding: "utf-8" })))
  );

  let token: Token;
  let adminTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;

  token = new Token(
    provider.connection,
    new PublicKey("3CmxzNhcvLUCkL8PNgyWA5qQ3S5nd1Z7e5c274VYPXJA"), // Mint
    TOKEN_PROGRAM_ID,
    admin
  );

  adminTokenAccount = new PublicKey("DwmVrpG94abvnXnfMLUbejzg9JqgutNCb4PpTp6zijvM");
  userTokenAccount = new PublicKey("4CrtayRMu2pB432k4LGuGV8cgwas9X3QY6DBEGWHeHME");
  let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);

  await inquirer.prompt([
  {
    name: 'action',
    message: 'Select option',
    type: 'list',
    choices: [
      "(1) Initialize",
      "(2) Stake",
      "(3) UnStake",
      "(4) Get Reward",
      "(5) Create Mint",
      "(6) Create User Token Account",
      "(7) Create Admin Token Account",
    ]
  }]).then(async function(answer){

    console.log(
      `
      user ${user.publicKey}
      admin ${admin.publicKey}
      userInfo ${userInfo.publicKey}
      userStakingWallet ${userTokenAccount}
      adminStakingWallet ${adminTokenAccount}
      stakingToken ${token.publicKey}
      tokenProgram ${TOKEN_PROGRAM_ID}
      systemProgram ${SystemProgram.programId}
      `
    );

    if (answer.action == "(1) Initialize") {
      const tx = await program.methods
        .initialize(new BN(1), new BN(1e10))
        .accounts({
          admin: admin.publicKey,
          poolInfo: poolInfo.publicKey,
          stakingToken: token.publicKey,
          adminStakingWallet: adminTokenAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin, poolInfo])
        .rpc();
        console.log("Your transaction signature", tx);
    }

    if (answer.action == "(2) Stake") {
        let userInfo = Keypair.generate();
        console.log(userInfo);
        fs.writeFileSync(USER_INFO_PATH, JSON.stringify(Array.from(userInfo.secretKey), null, 2), 'utf-8');

        let _userTokenAccount = await token.getAccountInfo(userTokenAccount);
        const tx = await program.methods
          .stake(new BN(1e10))
          .accounts({
            user: user.publicKey,
            admin: admin.publicKey,
            userInfo: userInfo.publicKey,
            userStakingWallet: userTokenAccount,
            adminStakingWallet: adminTokenAccount,
            stakingToken: token.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([user, userInfo])
          .rpc();
        console.log("Your transaction signature", tx);
        let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);
    }

    if (answer.action == "(3) UnStake") {
      let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);
        const tx = await program.methods
          .unstake()
          .accounts({
            user: user.publicKey,
            admin: admin.publicKey,
            userInfo: userInfo.publicKey,
            userStakingWallet: userTokenAccount,
            adminStakingWallet: adminTokenAccount,
            stakingToken: token.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        console.log("Your transaction signature", tx);
        let _userTokenAccount = await token.getAccountInfo(userTokenAccount);
    }

    if (answer.action == "(4) Get Reward") {
      let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);
      const tx = await program.methods
        .claimReward()
        .accounts({
          user: user.publicKey,
          admin: admin.publicKey,
          userInfo: userInfo.publicKey,
          userStakingWallet: userTokenAccount,
          adminStakingWallet: adminTokenAccount,
          stakingToken: token.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      console.log("Your transaction signature", tx);
      let _userTokenAccount = await token.getAccountInfo(userTokenAccount);
    }

    if (answer.action == "(5) Create Mint") {
      let newToken: Token = await Token.createMint(
        provider.connection,
        admin,
        admin.publicKey,
        null,
        9,
        TOKEN_PROGRAM_ID
      );
      await newToken.mintTo(userTokenAccount, admin.publicKey, [admin], 20e10);
    }

    if (answer.action == "(6) Create User Token Account") {
      await token.createAccount(user.publicKey);
    }

    if (answer.action == "(7) Create Admin Token Account") {
      await token.createAccount(admin.publicKey);
    }
  });
}

main().catch(console.error);

