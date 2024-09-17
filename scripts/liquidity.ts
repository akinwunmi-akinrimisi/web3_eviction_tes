import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {

    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
    const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory address


    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);
    const FACTORY = await ethers.getContractAt("IUniswapV2Factory", FACTORY_ADDRESS, impersonatedSigner);

    
    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
    
    const UNI_Contract = await ethers.getContractAt("IERC20", UNI, impersonatedSigner);

    
    console.log("USDC Wallet Balance: "+ await USDC_Contract.balanceOf(TOKEN_HOLDER));
    console.log("UNI Wallet Balance: "+ await UNI_Contract.balanceOf(TOKEN_HOLDER));
    const amountADesired = ethers.parseUnits("1", 18);
    const amountBDesired = ethers.parseUnits("2", 18);
    const amountAMin =  ethers.parseUnits("0", 18);         // amountAMin: Minimum USDT (just under 1 USDT)
    const amountBMin = ethers.parseUnits("0", 18);    // amountBMin: Minimum UNI (slightly less than 2 UNI)

    await USDC_Contract.approve(ROUTER, amountADesired);
    await UNI_Contract.approve(ROUTER, amountBDesired);

    // Set the deadline for the transaction (5 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + 300;

    console.log("Adding Liquidity...")
    const pool = await ROUTER.addLiquidity(
        USDC,
        UNI,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        TOKEN_HOLDER,
        deadline
    );

    console.log("Liquididty Added Successfully. 🤞");

    const LP_TOKEN = await FACTORY.getPair(USDC, UNI);
    if (LP_TOKEN === ethers.ZeroAddress) {
        console.log("No LP token for this pair. Are you sure the pair exists?");
        return;
    }
    console.log("USDC/UNI LP Token Address: ", LP_TOKEN);

      // Get LP token contract instance
      const LP_Contract = await ethers.getContractAt("IERC20", LP_TOKEN, impersonatedSigner);

      // Fetch LP token balance (liquidity amount)
    const liquidity = await LP_Contract.balanceOf(TOKEN_HOLDER);
    
    // Approve Router to spend LP tokens
    await LP_Contract.approve(ROUTER_ADDRESS, liquidity);


    // Remove liquidity from the pool
    const tx = await ROUTER.removeLiquidity(
        USDC,
        UNI,
        liquidity,
        amountAMin,
        amountBMin,
        TOKEN_HOLDER,
        deadline
    );

    await tx.wait(); // Wait for transaction to be mined
    console.log("Liquidity Removed Successfully. 👍");

}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});