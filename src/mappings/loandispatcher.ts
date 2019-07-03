import { LoanContractCreated as LoanContractCreatedEvent } from "../../generated/LoanContractDispatcher/LoanContractDispatcher"
import { LoanDispatcher, Loan, User } from "../../generated/schema"
import { LoanContract as NewLoan } from '../../generated/LoanContractDispatcher/templates'
import { LoanContract } from '../../generated/LoanContractDispatcher/templates/LoanContract/LoanContract'

export function handleLoanContractCreated(event: LoanContractCreatedEvent): void {
    let loanDispatcher = LoanDispatcher.load("1") // add loandispatcher address to event in SC to add multiplicity
    if (loanDispatcher == null) {
        loanDispatcher = new LoanDispatcher("1")
        loanDispatcher.loans = []
        loanDispatcher.loansCount = 0;
        
    }
    let loanAddress = event.params.contractAddress.toHex();

    let loans = loanDispatcher.loans
    let loanIndex = loans.indexOf(loanAddress)
    if (loanIndex == -1) {
        loans.push(loanAddress)
        loanDispatcher.loans = loans
        loanDispatcher.loansCount = loanDispatcher.loansCount + 1;
        loanDispatcher.save();

        // create loan
        let loan = new Loan(loanAddress)
        let loanContract = LoanContract.bind(event.params.contractAddress)

        loan.dispatcherId = '1'
        loan.address = event.params.contractAddress
        loan.originator = event.params.originator
        loan.minAmount = event.params.minAmount
        loan.maxAmount = event.params.maxAmount
        loan.bpMaxInterestRate = event.params.bpMaxInterestRate
        loan.state = 0 //'CREATED'
    
        let auctionStartBlock = loanContract.auctionStartBlock();
        let auctionEndBlock = loanContract.auctionEndBlock();
        let auctionBlockLength = loanContract.auctionBlockLength();
        let termEndTimestamp = loanContract.termEndTimestamp();

        loan.auctionStartBlock = auctionStartBlock;
        loan.auctionEndBlock = auctionEndBlock;
        loan.auctionBlockLength = auctionBlockLength;
        loan.termEndTimestamp = termEndTimestamp;

        loan.save()

        NewLoan.create(event.params.contractAddress)
        
        // create user
        let userId = event.params.originator.toHex();
        let user = User.load(userId)
        if (user == null) {
            user = new User(userId);
            user.address = event.params.originator;
            user.requests = [];
            user.fundings = [];
            user.deposited = false;
            user.kyced = false;
        }
        let requests = user.requests;
        requests.push(loan.id);
        user.requests = requests;
        
        user.save();
    }
}

