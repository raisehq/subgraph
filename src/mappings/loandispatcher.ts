import {
  LoanContractCreated as LoanContractCreatedEvent,
  MinAmountUpdated as MinAmountUpdatedEvent,
  MaxAmountUpdated as MaxAmountUpdatedEvent,
  MinInterestRateUpdated as MinInterestRateUpdatedEvent,
  MaxInterestRateUpdated as MaxInterestRateUpdatedEvent,
  OperatorFeeUpdated as OperatorFeeUpdatedEvent
} from "../../generated/LoanContractDispatcher/LoanContractDispatcher";
import { LoanDispatcher, Loan, User } from "../../generated/schema";
import { LoanContract as NewLoan } from "../../generated/LoanContractDispatcher/templates";
import { LoanContractDispatcher } from "../../generated/LoanContractDispatcher/LoanContractDispatcher";
import { BigInt, log } from "@graphprotocol/graph-ts";

export function handleLoanContractCreated(
  event: LoanContractCreatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  if (loanDispatcher == null) {
    loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
    loanDispatcher.address = dispatcherAddress;
    loanDispatcher.loans = [];
    loanDispatcher.loansCount = 0;
  }
  log.log(1, "1");
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

  log.log(1, "2");
  let loanAddress = event.params.contractAddress.toHex();

  let loans = loanDispatcher.loans;
  let loanIndex = loans.indexOf(loanAddress);
  if (loanIndex == -1) {
    loans.push(loanAddress);
    loanDispatcher.loans = loans;
    loanDispatcher.loansCount = loanDispatcher.loansCount + 1;
    loanDispatcher.save();

    log.log(1, "3");
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
    loan.minInterestRate = BigInt.fromI32(0);

    log.log(1, "4");

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

    log.log(1, "5");

    // borrower withdraw
    loan.operatorBalance = BigInt.fromI32(0);
    loan.operatorFeeWithdrawn = false;
    loan.loanWithdrawn = false;
    loan.loanRepaid = false;
    loan.loanWithdrawnAmount = BigInt.fromI32(0);

    log.log(1, "6");

    // lender withdraw
    loan.refundsWithdrawnAmount = BigInt.fromI32(0);
    loan.loanFullyRefunded = false;
    loan.refundStarted = false;

    log.log(1, "7");

    // metadata
    loan.createdBlockNumber = event.block.number;
    loan.createdTimestamp = event.block.timestamp;

    log.log(1, "8");
    loan.save();

    log.log(1, "9");
    NewLoan.create(event.params.contractAddress);
    log.log(1, "10");

    // create user
    let userId = event.params.originator.toHex();
    log.log(1, "11");
    let user = User.load(userId);
    log.log(1, "12");

    let requests = user.loanRequests;
    log.log(1, "user id" + user.id.toString());
    requests.push(loan.id);

    log.log(1, "13");
    user.loanRequests = requests;

    user.save();
    log.log(1, "14");
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
  }
  loanDispatcher.operatorFee = event.params.operatorFee;
  loanDispatcher.save();
}
