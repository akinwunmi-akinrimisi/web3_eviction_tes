import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const main = async () => {
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const ETHHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(ETHHolder);
  const impersonatedSigner = await ethers.getSigner(ETHHolder);

  // This is now the exact amount of DAI you want to receive
  const amountOut = ethers.parseUnits("18", 18);
  const path = [WETHAddress, DAIAddress];

  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt(
    "IUniswapV2Router01",
    UNIRouterAddress,
    impersonatedSigner
  );

  // Get the expected amount of ETH needed
  const amounts = await ROUTER.getAmountsIn(amountOut, path);
  const amountInMax = amounts[0];

  const ethBal = await ethers.provider.getBalance(impersonatedSigner.address);
  const daiBal = await DAI.balanceOf(impersonatedSigner.address);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("ETH balance before swap", ethers.formatEther(ethBal));
  console.log("DAI balance before swap", ethers.formatUnits(daiBal, 18));

  await ROUTER.swapETHForExactTokens(
    amountOut,
    path,
    impersonatedSigner.address,
    deadline,
    { value: amountInMax }
  );

  const ethBalAfter = await ethers.provider.getBalance(
    impersonatedSigner.address
  );
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);

  console.log("===========================================");
  console.log("ETH balance after swap", ethers.formatEther(ethBalAfter));
  console.log("DAI balance after swap", ethers.formatUnits(daiBalAfter, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});