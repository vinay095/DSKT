import { DbEmployee } from '../types/database';
import { generate999Employees } from '../lib/employeeGenerator';

export const MOCK_999_EMPLOYEES: DbEmployee[] = generate999Employees();

export const LOCATION_COUNTS = {
  noida6th: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Noida 6th Floor')).length,
  noida4th: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Noida 4th Floor')).length,
  hyderabad: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Hyderabad Office')).length,
  totalEmployees: MOCK_999_EMPLOYEES.length,
};
