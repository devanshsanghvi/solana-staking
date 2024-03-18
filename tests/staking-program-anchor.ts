import { join } from "path";
import { readFileSync } from "fs";
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token, getMint } from "@solana/spl-token";
import { StakingProgramAnchor } from "../target/types/staking_program_anchor";
import { assert } from "chai";

describe("staking-program-anchor", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  console.log(provider);

  anchor.setProvider(provider);

  const program = anchor.workspace
    .StakingProgramAnchor as Program<StakingProgramAnchor>;

  const WALLET_PATH = join(process.env["HOME"]!, ".config/solana/id.json");
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(WALLET_PATH, { encoding: "utf-8" })))
  );

  const user = Keypair.fromSecretKey(new Uint8Array(
    [
       64, 129, 112, 107, 242, 230, 254,  55,  33,  50, 254,
       51, 213, 110,   0,  80, 174, 182,  26, 173, 207, 118,
      196, 237, 112,  27, 170, 188, 216,  85,  41, 205, 183,
      192, 253,  49,  99, 202,  27, 215, 231, 178,  89,  25,
       84,  68,   7,  91, 157,  31, 102, 127, 203, 127, 136,
       53, 215, 249, 255,  69, 178,  25, 113, 114
    ]
  ));

  console.log(user);
  console.log(user.publicKey);


  const poolInfo = Keypair.generate();
  const userInfo = Keypair.generate();

  let token: Token;
  let adminTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;

  before(async () => {
    // await provider.connection.confirmTransaction(
    //   await provider.connection.requestAirdrop(
    //     user.publicKey,
    //     10 * LAMPORTS_PER_SOL
    //   ),
    //   "confirmed"
    // );



    token = new Token(
      provider.connection,
      new PublicKey("3CmxzNhcvLUCkL8PNgyWA5qQ3S5nd1Z7e5c274VYPXJA"),
      TOKEN_PROGRAM_ID,
      admin
    );
    // token = await token.getMintInfo();
    // token = await Token.createMint(
    //   provider.connection,
    //   admin,
    //   admin.publicKey,
    //   null,
    //   9,
    //   TOKEN_PROGRAM_ID
    // );
    console.log("token ", token);

    adminTokenAccount = new PublicKey("DwmVrpG94abvnXnfMLUbejzg9JqgutNCb4PpTp6zijvM"); // await 
token.createAccount(admin.publicKey);
    // console.log("adminTokenAccount ", adminTokenAccount);

    userTokenAccount = new PublicKey("4CrtayRMu2pB432k4LGuGV8cgwas9X3QY6DBEGWHeHME"); // await 
token.createAccount(user.publicKey);
    // console.log("userTokenAccount ", userTokenAccount);


    // await token.mintTo(userTokenAccount, admin.publicKey, [admin], 20e10);
  });

  it("Initialize", async () => {
    let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);

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
  });

  it("Stake", async () => {
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
  });

  it("Claim Reward", async () => {
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
  });

  it("Unstake", async () => {
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
  });
});

