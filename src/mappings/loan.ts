import {
    LoanContract,
    LoanCreated as LoanCreatedEvent,
    MinimumFundingReached as MinimumFundingReachedEvent,
    FullyFunded as FullyFundedEvent,
    Funded as FundedEvent,
    FailedToFund as FailedToFundEvent,
    LoanRepaid as LoanRepaidEvent,
    RepaymentWithdrawn as RepaymentWithdrawnEvent,
    FullyRepaid as FullyRepaidEvent,
    RefundWithdrawn as RefundWithdrawnEvent,
    FullyRefunded as FullyRefundedEvent,
    LoanFundsWithdrawn as LoanFundsWithdrawn,
    LoanDefaulted as LoanDefaultedEvent,
    RefundmaxAmount as RefundmaxAmountEvent
} from "../../generated/LoanContractDispatcher/templates/LoanContract/LoanContract"
import { Loan, User, Funding } from "../../generated/schema"

// TODO: why does not get this events
// export function handleLoanCreated(event: LoanCreatedEvent): void {
//     log.log(4, `******************* ENTER HANDLE LOAN CREATED **************** `);
//     let loanAddressHex = event.params.contractAddr.toHex()
//     let loan = Loan.load(loanAddressHex)
//     if (loan == null) {
//         loan = new Loan(loanAddressHex);
//     }

//     loan.originator = event.params.originator
//     loan.minAmount = event.params.minAmount
//     loan.maxAmount = event.params.maxAmount
//     loan.bpMaxInterestRate = event.params.bpMaxInterestRate
//     loan.auctionStartBlock = event.params.auctionStartBlock
//     loan.auctionEndBlock = event.params.auctionEndBlock
//     loan.save()
// }

//****************************
//TODO: double check race condition of events what happens??????????????
//*****************
export function handleMinimumFundingReached(event: MinimumFundingReachedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex();
    let loan = new Loan(loanAddressHex);
    
    let loanContract = LoanContract.bind(event.params.loanAddress);
    let loanState = loanContract.currentState();
    let minimumReached = loanContract.minimumReached();
    let auctionBalance = loanContract.auctionBalance();

    if (loanState == 2) {
        let auctionFundedBlock = loanContract.auctionFundedBlock();
        let borrowerDebt = loanContract.borrowerDebt();
        let interestRate = loanContract.getInterestRate();
        let auctionEnded = loanContract.auctionEnded();
    
        loan.auctionEnded = auctionEnded;
        loan.auctionFundedBlock = auctionFundedBlock;
        loan.borrowerDebt = borrowerDebt;
        loan.interestRate = interestRate;
    }

    loan.auctionBalance = auctionBalance;
    loan.state = loanState
    loan.minimumReached = minimumReached

    loan.save()
}

export function handleFullyFunded(event: FullyFundedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);
    
    let loanContract = LoanContract.bind(event.params.loanAddress)
    let loanState = loanContract.currentState()
    let auctionBalance = loanContract.auctionBalance();
    let auctionFundedBlock = loanContract.auctionFundedBlock();
    let borrowerDebt = loanContract.borrowerDebt();
    let interestRate = loanContract.getInterestRate();
    let auctionEnded = loanContract.auctionEnded();
    let termStartTimestamp = loanContract.termStartTimestamp();

    loan.termStartTimestamp = termStartTimestamp;
    loan.auctionEnded = auctionEnded;
    loan.auctionFundedBlock = auctionFundedBlock;
    loan.borrowerDebt = borrowerDebt;
    loan.interestRate = interestRate;
    
    loan.auctionBalance = auctionBalance;
    loan.state = loanState
    
    loan.save()
}

export function handleFunded(event: FundedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex();
    let loan = new Loan(loanAddressHex);
    
    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();
    let auctionBalance = loanContract.auctionBalance();
    let borrowerDebt = loanContract.borrowerDebt();
    let interestRate = loanContract.getInterestRate();
    let auctionEnded = loanContract.auctionEnded();

    loan.auctionEnded = auctionEnded;
    loan.borrowerDebt = borrowerDebt;
    loan.interestRate = interestRate;
    
    loan.auctionBalance = auctionBalance;
    loan.state = loanState

    loan.save()

    // Update User
    let userAddress = event.params.lender;
    let user = User.load(userAddress.toHex())
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.fundings = [];
        user.requests = [];
        user.referrals = [];
        user.deposited = false;
        user.kyced = false;
        user.referralBountyCount = 0;
    }

    // creating funding transaction
    let funding = new Funding(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
    funding.loan = loanAddressHex;
    funding.amount = event.params.amount;
    
    funding.save();

    let fundings = user.fundings;
    fundings.push(funding.id);
    user.fundings = fundings;

    user.save()
}

export function handleFailedToFund(event: FailedToFundEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress)

    let loanState = loanContract.currentState()
    let auctionBalance = loanContract.auctionBalance();
    let borrowerDebt = loanContract.borrowerDebt();
    let interestRate = loanContract.getInterestRate();
    let auctionEnded = loanContract.auctionEnded();

    loan.auctionEnded = auctionEnded;
    loan.borrowerDebt = borrowerDebt;
    loan.interestRate = interestRate;
    
    loan.auctionBalance = auctionBalance;
    loan.state = loanState

    loan.save()
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.loanRepaid = true;
    loan.loanRepaidTimestamp = event.params.timestampRepaid;
    loan.save(); 
}

export function handleRepaymentWithdrawn(event: RepaymentWithdrawnEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save(); 
}

export function handleRefundWithdrawn(event: RefundWithdrawnEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save(); 
}

export function handleFullyRefunded(event: FullyRefundedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save();
}

export function handleLoanFundsWithdrawn(event: LoanFundsWithdrawn): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.loanWithdrawn = true;
    loan.save();
}

export function handleLoanDefaulted(event: LoanDefaultedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save();
}
