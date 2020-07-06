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
  LoanContractCreated as LoanContractCreatedEvent,
  LoanTemplateUpdated as LoanTemplateUpdatedEvent,
  LoanTemplateUpdated,
} from "../../generated/LoanInstalmentsDispatcher/LoanInstalmentsDispatcher";
import {
  LoanInstalmentsDispatcher as LoanDispatcher,
  Loan,
  User,
} from "../../generated/schema";
import { LoanContractMultiCoin as NewLoan } from "../../generated/templates";
import { BigInt, log, Address } from "@graphprotocol/graph-ts";

export function handleLoanDispatcherCreated(
  event: LoanDispatcherCreatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
  loanDispatcher.address = dispatcherAddress;
  loanDispatcher.loans = [];
  loanDispatcher.loansCount = 0;
  loanDispatcher.acceptedTokens = [];

  loanDispatcher.auth = event.params.auth;
  loanDispatcher.DAIProxyAddress = event.params.DAIProxyAddress;
  loanDispatcher.swapFactory = event.params.swapFactory;
  loanDispatcher.minAuctionLength = event.params.minAuctionLength;
  loanDispatcher.minTermLength = event.params.minTermLength;
  loanDispatcher.operatorFee = event.params.operatorFee;
  loanDispatcher.minInterestRate = event.params.minInterestRate;
  loanDispatcher.maxInterestRate = event.params.maxInterestRate;
  loanDispatcher.maxAmount = event.params.maxAmount;
  loanDispatcher.minAmount = event.params.minAmount;

  loanDispatcher.save();
}

export function handleLoanContractCreated(
  event: LoanContractCreatedEvent
): void {
  let dispatcherAddress = event.address;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
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
    loan.minAmount = BigInt.fromI32(0);
    loan.maxAmount = BigInt.fromI32(0);
    loan.maxInterestRate = BigInt.fromI32(0);
    loan.state = 0; //'CREATED'
    loan.borrowerDebt = BigInt.fromI32(0);
    loan.loanFundsUnlocked = false;
    loan.operatorFee = BigInt.fromI32(0);
    loan.minInterestRate = BigInt.fromI32(0);

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
    loan.tokenAddress = new Address(0);

    loan.save();

    NewLoan.create(event.params.contractAddress);

    // create user
    let userId = event.params.originator.toHex();
    let user = User.load(userId);
    if (user == null) {
      user = new User(userId);
      user.address = event.params.originator;
      user.referrals = [];
      user.kyced = false;
      user.totalBountyWithdrawn = BigInt.fromI32(0);
      user.totalBountyToWithdraw = BigInt.fromI32(0);
      user.totalReferralsCount = 0;
      user.withdrawalUnlocked = false;
      user.loanFundings = [];
      user.loanRequests = [];
      user.createdBlockNumber = event.block.number;
      user.createdTimestamp = event.block.timestamp;
      user.deposited = false;
      user.investmentsCount = 0;
    }

    let requests = user.loanRequests;
    requests.push(loan.id);
    user.loanRequests = requests;

    user.save();
  } else {
    loanDispatcher.save();
  }
}

export function handleTemplateUpdated(event: LoanTemplateUpdatedEvent): void {
  let dispatcherAddress = event.address;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.loanTemplate = event.params.newTemplateAddress;
  loanDispatcher.save();
}

export function handleMinAmountUpdated(event: MinAmountUpdatedEvent): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.minAmount = event.params.minAmount;
  loanDispatcher.save();
}

export function handleMaxAmountUpdated(event: MaxAmountUpdatedEvent): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.maxAmount = event.params.maxAmount;
  loanDispatcher.save();
}

export function handleMinInterestRateUpdated(
  event: MinInterestRateUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.minInterestRate = event.params.minInterestRate;
  loanDispatcher.save();
}

export function handleMaxInterestRateUpdated(
  event: MaxInterestRateUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.maxInterestRate = event.params.maxInterestRate;
  loanDispatcher.save();
}

export function handleOperatorFeeUpdated(event: OperatorFeeUpdatedEvent): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.operatorFee = event.params.operatorFee;
  loanDispatcher.save();
}

export function handleAddTokenToAcceptedList(
  event: AddTokenToAcceptedListEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

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

  let acceptedTokens = loanDispatcher.acceptedTokens;
  acceptedTokens.splice(acceptedTokens.indexOf(event.params.tokenAddress), 1);

  loanDispatcher.acceptedTokens = acceptedTokens;

  loanDispatcher.save();
}

export function handleMinAuctionLengthUpdated(
  event: MinAuctionLengthUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.minAuctionLength = event.params.minAuctionLength;

  loanDispatcher.save();
}
export function handleMinTermLengthUpdated(
  event: MinTermLengthUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.minTermLength = event.params.minTermLength;

  loanDispatcher.save();
}

export function handleAuthAddressUpdated(event: AuthAddressUpdatedEvent): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.auth = event.params.newAuthAddress;

  loanDispatcher.save();
}

export function handleDaiProxyAddressUpdated(
  event: DaiProxyAddressUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.DAIProxyAddress = event.params.newDaiProxyAddress;

  loanDispatcher.save();
}

export function handleSwapFactoryAddressUpdated(
  event: SwapFactoryAddressUpdatedEvent
): void {
  let dispatcherAddress = event.params.loanDispatcher;
  let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());

  loanDispatcher.swapFactory = event.params.newSwapFactory;

  loanDispatcher.save();
}
