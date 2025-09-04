import { LoanRepository } from '../repositories/LoanRepository';
import { EligibilityService } from './EligibilityService';
import { CrimeAgentService } from './CrimeAgentService';
import { LoanApplication, LoanApplicationRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class LoanService {
  private loanRepository: LoanRepository;
  private eligibilityService: EligibilityService;
  private crimeAgentService: CrimeAgentService;

  constructor(
    loanRepository: LoanRepository,
    eligibilityService: EligibilityService,
    crimeAgentService: CrimeAgentService
  ) {
    this.loanRepository = loanRepository;
    this.eligibilityService = eligibilityService;
    this.crimeAgentService = crimeAgentService;
  }

  async processLoanApplication(request: LoanApplicationRequest): Promise<LoanApplication> {
    try {
      console.log(`Processing loan application for ${request.applicantName}`);

      // Step 1: Get crime grade for the property address
      const crimeGrade = await this.crimeAgentService.getCrimeGrade(request.propertyAddress);
      console.log(`Crime grade for ${request.propertyAddress}: ${crimeGrade}`);

      // Step 2: Evaluate eligibility
      const eligibilityResult = this.eligibilityService.evaluateEligibility(request, crimeGrade);

      console.log(`Eligibility result: ${eligibilityResult.eligible ? 'APPROVED' : 'DENIED'} - ${eligibilityResult.reason}`);

      // Step 3: Create loan application record
      const loanApplication = await this.loanRepository.create({
        applicantName: request.applicantName,
        propertyAddress: request.propertyAddress,
        creditScore: request.creditScore,
        monthlyIncome: request.monthlyIncome,
        requestedAmount: request.requestedAmount,
        loanTermMonths: request.loanTermMonths,
        eligible: eligibilityResult.eligible,
        reason: eligibilityResult.reason,
        crimeGrade
      });

      console.log(`Loan application created with ID: ${loanApplication.id}`);
      return loanApplication;

    } catch (error) {
      console.error('Error processing loan application:', error);
      throw new Error(`Failed to process loan application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLoanApplication(id: string): Promise<LoanApplication | null> {
    try {
      console.log(`Retrieving loan application with ID: ${id}`);
      const loanApplication = await this.loanRepository.findById(id);
      
      if (!loanApplication) {
        console.log(`Loan application not found: ${id}`);
        return null;
      }

      console.log(`Retrieved loan application for ${loanApplication.applicantName}`);
      return loanApplication;

    } catch (error) {
      console.error('Error retrieving loan application:', error);
      throw new Error(`Failed to retrieve loan application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllLoanApplications(): Promise<LoanApplication[]> {
    try {
      console.log('Retrieving all loan applications');
      const applications = await this.loanRepository.findAll();
      console.log(`Retrieved ${applications.length} loan applications`);
      return applications;

    } catch (error) {
      console.error('Error retrieving loan applications:', error);
      throw new Error(`Failed to retrieve loan applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLoanApplication(id: string, updates: Partial<LoanApplicationRequest>): Promise<LoanApplication | null> {
    try {
      console.log(`Updating loan application with ID: ${id}`);

      // If any eligibility-affecting fields are updated, re-evaluate
      const needsReEvaluation = updates.creditScore !== undefined ||
                               updates.monthlyIncome !== undefined ||
                               updates.requestedAmount !== undefined ||
                               updates.loanTermMonths !== undefined ||
                               updates.propertyAddress !== undefined;

      let updateData: any = { ...updates };

      if (needsReEvaluation) {
        // Get current application to merge with updates
        const currentApp = await this.loanRepository.findById(id);
        if (!currentApp) {
          return null;
        }

        const mergedData = {
          applicantName: updates.applicantName ?? currentApp.applicantName,
          creditScore: updates.creditScore ?? currentApp.creditScore,
          monthlyIncome: updates.monthlyIncome ?? currentApp.monthlyIncome,
          requestedAmount: updates.requestedAmount ?? currentApp.requestedAmount,
          loanTermMonths: updates.loanTermMonths ?? currentApp.loanTermMonths,
          propertyAddress: updates.propertyAddress ?? currentApp.propertyAddress
        };

        // Re-evaluate crime grade if address changed
        const crimeGrade = updates.propertyAddress 
          ? await this.crimeAgentService.getCrimeGrade(updates.propertyAddress)
          : currentApp.crimeGrade;

        // Re-evaluate eligibility
        const eligibilityResult = this.eligibilityService.evaluateEligibility(mergedData, crimeGrade);

        updateData = {
          ...updateData,
          eligible: eligibilityResult.eligible,
          reason: eligibilityResult.reason,
          crimeGrade
        };

        console.log(`Re-evaluated eligibility: ${eligibilityResult.eligible ? 'APPROVED' : 'DENIED'} - ${eligibilityResult.reason}`);
      }

      const updatedApplication = await this.loanRepository.update(id, updateData);
      
      if (updatedApplication) {
        console.log(`Updated loan application for ${updatedApplication.applicantName}`);
      }

      return updatedApplication;

    } catch (error) {
      console.error('Error updating loan application:', error);
      throw new Error(`Failed to update loan application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteLoanApplication(id: string): Promise<boolean> {
    try {
      console.log(`Deleting loan application with ID: ${id}`);
      const deleted = await this.loanRepository.delete(id);
      
      if (deleted) {
        console.log(`Successfully deleted loan application: ${id}`);
      } else {
        console.log(`Loan application not found for deletion: ${id}`);
      }

      return deleted;

    } catch (error) {
      console.error('Error deleting loan application:', error);
      throw new Error(`Failed to delete loan application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}