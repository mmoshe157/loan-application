import { LoanApplication, DatabaseLoanApplication } from '../types';
import { getDatabase } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export class LoanRepository {
  async create(loanData: Omit<LoanApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoanApplication> {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO loans (
        id, applicant_name, property_address, credit_score, monthly_income,
        requested_amount, loan_term_months, eligible, reason, crime_grade,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        loanData.applicantName,
        loanData.propertyAddress,
        loanData.creditScore,
        loanData.monthlyIncome,
        loanData.requestedAmount,
        loanData.loanTermMonths,
        loanData.eligible ? 1 : 0,
        loanData.reason,
        loanData.crimeGrade,
        now,
        now
      ]
    );

    return {
      ...loanData,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async findById(id: string): Promise<LoanApplication | null> {
    const db = await getDatabase();
    const row = await db.get<DatabaseLoanApplication>(
      'SELECT * FROM loans WHERE id = ?',
      [id]
    );

    if (!row) {
      return null;
    }

    return this.mapDatabaseToApplication(row);
  }

  async findAll(): Promise<LoanApplication[]> {
    const db = await getDatabase();
    const rows = await db.all<DatabaseLoanApplication[]>('SELECT * FROM loans ORDER BY created_at DESC');
    
    return rows.map(row => this.mapDatabaseToApplication(row));
  }

  async update(id: string, updates: Partial<Omit<LoanApplication, 'id' | 'createdAt' | 'updatedAt'>>): Promise<LoanApplication | null> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const setClause = [];
    const values = [];

    if (updates.applicantName !== undefined) {
      setClause.push('applicant_name = ?');
      values.push(updates.applicantName);
    }
    if (updates.propertyAddress !== undefined) {
      setClause.push('property_address = ?');
      values.push(updates.propertyAddress);
    }
    if (updates.creditScore !== undefined) {
      setClause.push('credit_score = ?');
      values.push(updates.creditScore);
    }
    if (updates.monthlyIncome !== undefined) {
      setClause.push('monthly_income = ?');
      values.push(updates.monthlyIncome);
    }
    if (updates.requestedAmount !== undefined) {
      setClause.push('requested_amount = ?');
      values.push(updates.requestedAmount);
    }
    if (updates.loanTermMonths !== undefined) {
      setClause.push('loan_term_months = ?');
      values.push(updates.loanTermMonths);
    }
    if (updates.eligible !== undefined) {
      setClause.push('eligible = ?');
      values.push(updates.eligible ? 1 : 0);
    }
    if (updates.reason !== undefined) {
      setClause.push('reason = ?');
      values.push(updates.reason);
    }
    if (updates.crimeGrade !== undefined) {
      setClause.push('crime_grade = ?');
      values.push(updates.crimeGrade);
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.run(
      `UPDATE loans SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM loans WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  private mapDatabaseToApplication(row: DatabaseLoanApplication): LoanApplication {
    return {
      id: row.id,
      applicantName: row.applicant_name,
      propertyAddress: row.property_address,
      creditScore: row.credit_score,
      monthlyIncome: row.monthly_income,
      requestedAmount: row.requested_amount,
      loanTermMonths: row.loan_term_months,
      eligible: Boolean(row.eligible),
      reason: row.reason,
      crimeGrade: row.crime_grade,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}