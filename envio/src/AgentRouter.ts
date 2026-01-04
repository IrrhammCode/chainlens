import { AgentSwapExecuted } from "../generated/AgentRouter/AgentRouter";
import { UserTrade, TotalVolume } from "../generated/schema";

export function handleAgentSwapExecuted(event: AgentSwapExecuted): void {
  // Create UserTrade entity
  const tradeId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  const trade = new UserTrade(tradeId);
  
  trade.user = event.params.user;
  trade.tokenIn = event.params.tokenIn;
  trade.tokenOut = event.params.tokenOut;
  trade.amountIn = event.params.amountIn;
  trade.amountOut = event.params.amountOut;
  trade.timestamp = event.params.timestamp;
  trade.transactionHash = event.transaction.hash;
  trade.blockNumber = event.block.number;
  
  trade.save();

  // Update TotalVolume
  let totalVolume = TotalVolume.load("TOTAL");
  if (totalVolume == null) {
    totalVolume = new TotalVolume("TOTAL");
    totalVolume.totalAmountIn = BigInt.fromI32(0);
    totalVolume.totalAmountOut = BigInt.fromI32(0);
    totalVolume.totalTrades = BigInt.fromI32(0);
  }

  totalVolume.totalAmountIn = totalVolume.totalAmountIn.plus(event.params.amountIn);
  totalVolume.totalAmountOut = totalVolume.totalAmountOut.plus(event.params.amountOut);
  totalVolume.totalTrades = totalVolume.totalTrades.plus(BigInt.fromI32(1));
  totalVolume.lastUpdated = event.block.timestamp;
  
  totalVolume.save();
}

