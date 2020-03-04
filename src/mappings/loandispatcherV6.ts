import {
  MinAmountUpdated as MinAmountUpdatedEvent,
  MaxAmountUpdated as MaxAmountUpdatedEvent,
  MinInterestRateUpdated as MinInterestRateUpdatedEvent,
  MaxInterestRateUpdated as MaxInterestRateUpdatedEvent,
  OperatorFeeUpdated as OperatorFeeUpdatedEvent,
  AddTokenToAcceptedList as AddTokenToAcceptedListEvent,
  RemoveTokenFromAcceptedList as RemoveTokenFromAcceptedListEvent,
  MinAuctionLengthUpdated as MinAuctionLengthUpdatedEvent,
  MinTermLengthUpdated as MinTermLengthUpdatedEvent,
  LoanDispatcherCreated as LoanDispatcherCreatedEvent,
  AuthAddressUpdated as AuthAddressUpdatedEvent,
  DaiProxyAddressUpdated as DaiProxyAddressUpdatedEvent,
  SwapFactoryAddressUpdated as SwapFactoryAddressUpdatedEvent,
  LoanContractCreated as LoanContractWithRangeCreatedEvent,
  LoanContractDispatcherWithRange as LoanContractDispatcher
} from "../../generated/LoanContractDispatcherWithRange/LoanContractDispatcherWithRange";
import { LoanDispatcher, Loan, User } from "../../generated/schema";
import { LoanContractWithRange as NewLoan } from "../../generated/LoanContractDispatcherWithRange/templates";
import { BigInt, log } from "@graphprotocol/graph-ts";

export function handleLoanDispatcherCreated(
  event: LoanDispatcherCreatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }

  loanDispatcher.save();
}

export function handleLoanContractWithRangeCreated(
  event: LoanContractWithRangeCreatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }

  let loanContractDispatcher = LoanContractDispatcher.bind(dispatcherAddress);
  let minAuctionLength = loanContractDispatcher.minAuctionLength();
  let minTermLength = loanContractDispatcher.minTermLength();

  loanDispatcher.minAuctionLength = minAuctionLength;
  loanDispatcher.minTermLength = minTermLength;
  loanDispatcher.minAmount = event.params.minAmount;
  loanDispatcher.maxAmount = event.params.maxAmount;
  loanDispatcher.minInterestRate = BigInt.fromI32(0);
  loanDispatcher.maxInterestRate = event.params.maxInterestRate;
  loanDispatcher.operatorFee = event.params.operatorFee;

  let loanAddress = event.params.contractAddress.toHex();

  let loans = loanDispatcher.loans;
  let loanIndex = loans.indexOf(loanAddress);
  if (loanIndex == -1) {
    loans.push(loanAddress);
    loanDispatcher.loans = loans;
    loanDispatcher.loansCount = loanDispatcher.loansCount + 1;
    loanDispatcher.save();

    // create loan
    let loan = new Loan(loanAddress);

    // loan status
    loan.investors = [];
    loan.investorCount = 0;
    loan.dispatcherId = loanDispatcher.id;
    loan.address = event.params.contractAddress;
    loan.originator = event.params.originator;
    loan.minAmount = event.params.minAmount;
    loan.maxAmount = event.params.maxAmount;
    loan.maxInterestRate = event.params.maxInterestRate;
    loan.state = 0; //'CREATED'
    loan.borrowerDebt = BigInt.fromI32(0);
    loan.loanFundsUnlocked = false;
    loan.operatorFee = BigInt.fromI32(0);
    loan.minInterestRate = event.params.minInterestRate;

    // loan Funding/Auction fase
    loan.auctionStartTimestamp = BigInt.fromI32(0);
    loan.auctionEndTimestamp = BigInt.fromI32(0);
    loan.auctionLength = BigInt.fromI32(0);
    loan.termEndTimestamp = BigInt.fromI32(0);
    loan.termLength = BigInt.fromI32(0);
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
    loan.tokenAddress = event.block.tokenAddress;

    loan.save();

    NewLoan.create(event.params.contractAddress);

    // create user
    let userId = event.params.originator.toHex();
    let user = User.load(userId);

    let requests = user.loanRequests;
    requests.push(loan.id);
    user.loanRequests = requests;

    user.save();
  } else {
    loanDispatcher.save();
  }
}

export function handleMinAmountUpdated(event: MinAmountUpdatedEvent): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }
  loanDispatcher.minAmount = event.params.minAmount;
  loanDispatcher.save();
}

export function handleMaxAmountUpdated(event: MaxAmountUpdatedEvent): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }
  loanDispatcher.maxAmount = event.params.maxAmount;
  loanDispatcher.save();
}

export function handleMinInterestRateUpdated(
  event: MinInterestRateUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }
  loanDispatcher.minInterestRate = event.params.minInterestRate;
  loanDispatcher.save();
}

export function handleMaxInterestRateUpdated(
  event: MaxInterestRateUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }
  loanDispatcher.maxInterestRate = event.params.maxInterestRate;
  loanDispatcher.save();
}

export function handleOperatorFeeUpdated(event: OperatorFeeUpdatedEvent): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }
  loanDispatcher.operatorFee = event.params.operatorFee;
  loanDispatcher.save();
}

export function handleAddTokenToAcceptedList(
  event: AddTokenToAcceptedListEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }

  let acceptedTokens = loanDispatcher.acceptedTokens;
  acceptedTokens.push(event.params.tokenAddress);

  loanDispatcher.acceptedTokens = acceptedTokens;

  loanDispatcher.save();
}

export function handleRemoveTokenFromAcceptedList(
  event: RemoveTokenFromAcceptedListEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }

  let acceptedTokens = loanDispatcher.acceptedTokens;
  let newAcceptedTokens = acceptedTokens.splice(
    acceptedTokens.indexOf(event.params.tokenAddress),
    1
  );

  loanDispatcher.acceptedTokens = newAcceptedTokens;

  loanDispatcher.save();
}

export function handleMinAuctionLengthUpdated(
  event: MinAuctionLengthUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }

  loanDispatcher.save();
}
export function handleMinTermLengthUpdated(
  event: MinTermLengthUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
    loanDispatcher.acceptedTokens = [];
  }

  loanDispatcher.save();
}

export function handleAuthAddressUpdated(
  event: AuthAddressUpdatedEvent
): void {}
export function handleDaiProxyAddressUpdated(
  event: DaiProxyAddressUpdatedEvent
): void {}
export function handleSwapFactoryAddressUpdated(
  event: SwapFactoryAddressUpdatedEvent
): void {}
