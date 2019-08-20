import { 
    LoanContractCreated as LoanContractCreatedEvent,
    MinAmountUpdated as MinAmountUpdatedEvent,
    MaxAmountUpdated as MaxAmountUpdatedEvent,
    MinInterestRateUpdated as MinInterestRateUpdatedEvent,
    MaxInterestRateUpdated as MaxInterestRateUpdatedEvent,
    OperatorFeeUpdated as OperatorFeeUpdatedEvent,
} from "../../generated/LoanContractDispatcher/LoanContractDispatcher";
import { LoanDispatcher, Loan, User } from "../../generated/schema";
import { LoanContract as NewLoan } from '../../generated/LoanContractDispatcher/templates';
import { LoanContract } from '../../generated/LoanContractDispatcher/templates/LoanContract/LoanContract';
import { LoanContractDispatcher } from '../../generated/LoanContractDispatcher/LoanContractDispatcher';
import { BigInt } from '@graphprotocol/graph-ts';

export function handleLoanContractCreated(event: LoanContractCreatedEvent): void {
    let dispatcherAddress = event.params.loanDispatcher;
    let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
    if (loanDispatcher == null) {
        loanDispatcher = new LoanDispatcher(dispatcherAddress.toHex());
        loanDispatcher.address = dispatcherAddress;
        loanDispatcher.loans = [];
        loanDispatcher.loansCount = 0;
    }

    let loanContractDispatcher = LoanContractDispatcher.bind(dispatcherAddress);
    let dispatcherMinInterestRate = loanContractDispatcher.minInterestRate();

    loanDispatcher.minAmount = event.params.minAmount;
    loanDispatcher.maxAmount = event.params.maxAmount;
    loanDispatcher.minInterestRate = dispatcherMinInterestRate;
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
        loan.dispatcherId = dispatcherAddress.toHex();
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
    loanDispatcher.minAmount = event.params.minAmount;
    loanDispatcher.save();
}

export function handleMaxAmountUpdated(event: MaxAmountUpdatedEvent): void {
    let dispatcherAddress = event.params.loanDispatcher;
    let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
    loanDispatcher.maxAmount = event.params.maxAmount;
    loanDispatcher.save();
}

export function handleMinInterestRateUpdated(event: MinInterestRateUpdatedEvent): void {
    let dispatcherAddress = event.params.loanDispatcher;
    let loanDispatcher = LoanDispatcher.load(dispatcherAddress.toHex());
    loanDispatcher.minInterestRate = event.params.minInterestRate;
    loanDispatcher.save();
}

export function handleMaxInterestRateUpdated(event: MaxInterestRateUpdatedEvent): void {
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