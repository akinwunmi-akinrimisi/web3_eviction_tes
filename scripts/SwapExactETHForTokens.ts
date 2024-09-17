import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const main = async () => {
  const wethAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const daiAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const ETHHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(ETHHolder);
  const impersonatedSigner = await ethers.getSigner(ETHHolder);

  const amountETH = ethers.parseUnits("10", 18);
  const path = [wethAddr, daiAddr];

  const DAI = await ethers.getContractAt("IERC20", daiAddr);
  const ROUTER = await ethers.getContractAt(
    "IUniswapV2Router01",
    UNIRouterAddress,
    impersonatedSigner
  );

  const amounts = await ROUTER.getAmountsOut(amountETH, path);
  const amountOutMin = ethers.parseUnits("230", 18);

  const ethBal = await ethers.provider.getBalance(impersonatedSigner.address);
  const daiBal = await DAI.balanceOf(impersonatedSigner.address);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("ETH balance before swap", Number(ethBal));
  console.log("DAI balance before swap", Number(daiBal));

  await ROUTER.swapExactETHForTokens(
    amountOutMin,
    path,
    impersonatedSigner.address,
    deadline,
    { value: amountETH }
  );

  const ethBalAfter = await ethers.provider.getBalance(
    impersonatedSigner.address
  );
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);

  console.log("===========================================");
  console.log("ETH balance after swap", Number(ethBalAfter));
  console.log("DAI balance after swap", Number(daiBalAfter));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});