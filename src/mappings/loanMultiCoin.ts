import {
  LoanCreated as LoanCreatedWithRangeEvent,
  LoanContractMultiCoin as LoanContract,
  MinimumFundingReached as MinimumFundingReachedEvent,
  FullyFunded as FullyFundedEvent,
  Funded as FundedEvent,
  FailedToFund as FailedToFundEvent,
  LoanRepaid as LoanRepaidEvent,
  RepaymentWithdrawn as RepaymentWithdrawnEvent,
  RefundWithdrawn as RefundWithdrawnEvent,
  FullyRefunded as FullyRefundedEvent,
  LoanFundsWithdrawn,
  LoanDefaulted as LoanDefaultedEvent,
  OperatorWithdrawn as OperatorWithdrawnEvent,
  AuctionSuccessful as AuctionSuccessfulEvent,
  FundsUnlockedWithdrawn as FundsUnlockedWithdrawnEvent,
  FullyFundsUnlockedWithdrawn as FullyFundsUnlockedWithdrawnEvent,
  LoanFundsUnlocked as LoanFundsUnlockedEvent,
} from "../../generated/templates/LoanContractMultiCoin/LoanContractMultiCoin";
import { Loan, User, Funding, Raise } from "../../generated/schema";
import { log, BigInt } from "@graphprotocol/graph-ts";
// import { LoanContract as NewLoan } from "../../generated/LoanContractDispatcher/templates";

export function handleLoanWithRangeCreated(
  event: LoanCreatedWithRangeEvent
): void {
  let loanAddress = event.params.contractAddr.toHex();

  // create loan
  let loan = new Loan(loanAddress);
  let loanContract = LoanContract.bind(event.params.contractAddr);

  let auctionStartTimestamp = loanContract.auctionStartTimestamp();
  let auctionEndTimestamp = loanContract.auctionEndTimestamp();
  let auctionLength = loanContract.auctionLength();
  let termEndTimestamp = loanContract.termEndTimestamp();
  let termLength = loanContract.termLength();
  let operatorFee = loanContract.operatorFee();

  // loan status
  loan.investors = [];
  loan.investorCount = 0;
  loan.address = event.params.contractAddr;
  loan.originator = event.params.originator;
  loan.minAmount = event.params.minAmount;
  loan.maxAmount = event.params.maxAmount;
  loan.type = "Bullet";
  loan.instalmentsPaid = BigInt.fromI32(0);
  loan.penaltiesPaid = BigInt.fromI32(0);
  loan.currentInstalment = BigInt.fromI32(0);
  loan.loanAmountPaid = BigInt.fromI32(0);
  loan.maxInterestRate = event.params.maxInterestRate;
  loan.state = 0; //'CREATED'
  loan.borrowerDebt = BigInt.fromI32(0);
  loan.loanFundsUnlocked = false;
  loan.operatorFee = operatorFee;
  loan.minInterestRate = event.params.minInterestRate;

  // loan Funding/Auction fase
  loan.auctionStartTimestamp = auctionStartTimestamp;
  loan.auctionEndTimestamp = auctionEndTimestamp;
  loan.auctionLength = auctionLength;
  loan.termEndTimestamp = termEndTimestamp;
  loan.termLength = termLength;
  loan.principal = BigInt.fromI32(0);
  loan.minimumReached = false;
  loan.auctionFullyFunded = false;
  loan.auctionEnded = false;
  loan.auctionFailed = false;

  // borrower withdraw
  loan.operatorBalance = BigInt.fromI32(0);
  loan.operatorFeeWithdrawn = false;
  loan.loanWithdrawn = false;
  loan.loanRepaid = false;
  loan.loanWithdrawnAmount = BigInt.fromI32(0);

  // lender withdraw
  loan.refundsWithdrawnAmount = BigInt.fromI32(0);
  loan.loanFullyRefunded = false;
  loan.refundStarted = false;

  // metadata
  loan.createdBlockNumber = event.block.number;
  loan.createdTimestamp = event.block.timestamp;
  loan.tokenAddress = event.params.tokenAddress;

  loan.save();

  // NewLoan.create(event.params.contractAddr);

  // let userId = event.params.originator.toHex();
  // let user = User.load(userId);

  // let requests = user.loanRequests;
  // requests.push(loan.id);
  // user.loanRequests = requests;

  // user.save();
}

export function handleMinimumFundingReached(
  event: MinimumFundingReachedEvent
): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);
  let loanState = loanContract.currentState();
  let minimumReached = loanContract.minimumReached();

  if (loanState == 2) {
    let auctionLastFundedTimestamp = loanContract.lastFundedTimestamp();
    let borrowerDebt = loanContract.borrowerDebt();

    loan.auctionLastFundedTimestamp = auctionLastFundedTimestamp;
    loan.borrowerDebt = borrowerDebt;
    loan.interestRate = event.params.interest;
  }

  loan.state = loanState;
  loan.minimumReached = minimumReached;

  loan.save();
}

export function handleFullyFunded(event: FullyFundedEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);
  let loanState = loanContract.currentState();

  loan.auctionEnded = true;
  loan.auctionLastFundedTimestamp = event.params.fundedTimestamp;
  loan.borrowerDebt = event.params.balanceToRepay;
  loan.interestRate = event.params.interest;

  loan.auctionFullyFunded = true;
  loan.state = loanState;

  loan.save();
}

export function handleFunded(event: FundedEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = Loan.load(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();

  loan.interestRate = event.params.interest;

  loan.lastFundedTimestamp = event.params.fundedTimestamp;

  loan.principal = loan.principal.plus(event.params.amount);
  loan.state = loanState;

  let userAddress = event.params.lender;
  let user = User.load(userAddress.toHex());

  let investors = loan.investors;

  if (investors.indexOf(userAddress.toHex()) == -1) {
    investors.push(userAddress.toHex());
    loan.investorCount = loan.investorCount + 1;
    loan.investors = investors;
  }

  loan.save();

  // creating funding transaction
  let fundingId = userAddress.toHex() + "-" + loanAddressHex;
  let funding = Funding.load(fundingId);
  if (funding == null) {
    funding = new Funding(fundingId);
    funding.loan = loanAddressHex;
    funding.amount = BigInt.fromI32(0);
    funding.withdrawn = false;
    funding.investmentsCount = 0;
    funding.amountWithdrawn = BigInt.fromI32(0);
    funding.createdBlockNumber = event.block.number;
    funding.createdTimestamp = event.block.timestamp;
    funding.user = user.id;
    funding.instalmentsWithdrawed = BigInt.fromI32(0);
    funding.penaltiesWithdrawed = BigInt.fromI32(0);

    // save new funding to user
    let fundings = user.loanFundings;
    fundings.push(funding.id);
    user.loanFundings = fundings;
  }

  funding.updatedBlockNumber = event.block.number;
  funding.updatedTimestamp = event.block.timestamp;
  funding.amount = funding.amount.plus(event.params.amount);
  funding.investmentsCount = funding.investmentsCount + 1;
  funding.save();

  if (user.investmentsCount == 0) {
    user.firstInvestmentAmount = event.params.amount;
    user.firstInvestmentTimestamp = event.block.timestamp;
    user.firstInvestmentBlockNumber = event.block.number;
  }

  user.investmentsCount = user.investmentsCount + 1;
  user.save();
}

export function handleFailedToFund(event: FailedToFundEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();
  let interestRate = loanContract.getInterestRate();

  loan.interestRate = interestRate;

  loan.state = loanState;

  if (loanState == 1) {
    loan.auctionEnded = true;
    loan.auctionFailed = true;
  }

  loan.save();

  // creating funding transaction
  // let userAddress = event.params.lender;
  // let user = User.load(userAddress.toHex());

  // let fundingId = userAddress.toHex() + "-" + loanAddressHex;
  // let funding = Funding.load(fundingId);
  // if (funding == null) {
  //   funding = new Funding(fundingId);
  //   funding.loan = loanAddressHex;
  //   funding.amount = BigInt.fromI32(0);
  //   funding.withdrawn = false;
  //   funding.amountWithdrawn = BigInt.fromI32(0);
  // }
  // funding.save();

  // let fundings = user.loanFundings;
  // fundings.push(funding.id);
  // user.loanFundings = fundings;

  // user.save();
}

export function handleAuctionSuccessful(event: AuctionSuccessfulEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);
  let loanState = loanContract.currentState();
  let termEndTimestamp = loanContract.termEndTimestamp();

  loan.auctionEnded = true;
  loan.netBalance = event.params.auctionBalance;
  loan.borrowerDebt = event.params.balanceToRepay;
  loan.operatorBalance = event.params.operatorBalance;
  loan.interestRate = event.params.interest;
  loan.lastFundedTimestamp = event.params.fundedTimestamp;

  loan.termEndTimestamp = termEndTimestamp;
  loan.state = loanState;

  loan.save();

  // Add fees to raise
  let raise = Raise.load("1");
  if (raise == null) {
    raise = new Raise("1");
    raise.feesToWithdraw = BigInt.fromI32(0);
    raise.feesWithdrawn = BigInt.fromI32(0);
  }
  raise.feesToWithdraw = raise.feesToWithdraw.plus(
    event.params.operatorBalance
  );
  raise.save();
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();

  loan.state = loanState;
  loan.loanRepaid = true;
  loan.loanRepaidTimestamp = event.params.timestampRepaid;
  loan.save();
}

export function handleRepaymentWithdrawn(event: RepaymentWithdrawnEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();
  let refundsWithdrawnAmount = loanContract.loanWithdrawnAmount();

  loan.refundsWithdrawnAmount = refundsWithdrawnAmount;
  loan.refundStarted = true;
  loan.state = loanState;
  loan.save();

  // creating funding transaction
  let userAddress = event.params.to;
  let funding = new Funding(userAddress.toHex() + "-" + loanAddressHex);
  funding.withdrawn = true;
  funding.amountWithdrawn = event.params.amount;
  funding.save();
}

export function handleRefundWithdrawn(event: RefundWithdrawnEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();
  let loanWithdrawnAmount = loanContract.loanWithdrawnAmount();

  loan.loanWithdrawnAmount = loanWithdrawnAmount;
  loan.refundStarted = true;
  loan.state = loanState;
  loan.save();

  // creating funding transaction
  let userAddress = event.params.lender;
  let funding = new Funding(userAddress.toHex() + "-" + loanAddressHex);
  funding.withdrawn = true;
  funding.amountWithdrawn = event.params.amount;
  funding.save();
}

export function handleFundsUnlockedWithdrawn(
  event: FundsUnlockedWithdrawnEvent
): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();
  let loanWithdrawnAmount = loanContract.loanWithdrawnAmount();

  loan.loanWithdrawnAmount = loanWithdrawnAmount;
  loan.refundStarted = true;
  loan.state = loanState;
  loan.save();

  // creating funding transaction
  let userAddress = event.params.lender;
  let funding = new Funding(userAddress.toHex() + "-" + loanAddressHex);
  funding.withdrawn = true;
  funding.amountWithdrawn = event.params.amount;
  funding.save();
}

export function handleFullyRefunded(event: FullyRefundedEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();

  loan.state = loanState;
  loan.loanFullyRefunded = true;

  loan.save();
}

export function handleFullyFundsUnlockedWithdrawn(
  event: FullyFundsUnlockedWithdrawnEvent
): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();

  loan.state = loanState;
  loan.loanFullyRefunded = true;

  loan.save();
}

export function handleLoanFundsWithdrawn(event: LoanFundsWithdrawn): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();

  loan.state = loanState;
  loan.loanWithdrawn = true;
  loan.loanWithdrawnAmount = event.params.amount;
  loan.save();
}

export function handleLoanDefaulted(event: LoanDefaultedEvent): void {
  let loanAddressHex = event.params.loanAddress.toHex();
  let loan = new Loan(loanAddressHex);

  let loanContract = LoanContract.bind(event.params.loanAddress);

  let loanState = loanContract.currentState();

  loan.state = loanState;
  loan.save();
}

export function handleOperatorWithdrawn(event: OperatorWithdrawnEvent): void {
  let raise = new Raise("1");

  raise.feesWithdrawn = event.params.amount;
  raise.feesToWithdraw = raise.feesToWithdraw.minus(event.params.amount);
  raise.save();
}

export function handleLoanFundsUnlocked(event: LoanFundsUnlockedEvent): void {
  let loanAddressHex = event.address.toHex();
  let loan = new Loan(loanAddressHex);
  let loanContract = LoanContract.bind(event.address);

  let loanState = loanContract.currentState();
  loan.loanFundsUnlocked = true;
  loan.state = loanState;
  loan.save();
}
