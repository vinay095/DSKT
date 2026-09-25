import { DbEmployee } from '../types/database';
import { generate999Employees } from '../lib/employeeGenerator';

export const MOCK_999_EMPLOYEES: DbEmployee[] = generate999Employees();

export const LOCATION_COUNTS = {
  noida6th: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Noida 6th Floor')).length,
  noida4th: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Noida 4th Floor')).length,
  hyderabad: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Hyderabad Office')).length,
  kolkata: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Kolkata Office')).length,
  dubai: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Dubai Office')).length,
  romania: MOCK_999_EMPLOYEES.filter((e) => e.locations.includes('Romania Office')).length,
  totalEmployees: MOCK_999_EMPLOYEES.length,
};

export const DIRECTORY_LOCATION_FILTERS = [
  { id: 'all', label: 'All Offices', count: LOCATION_COUNTS.totalEmployees },
  { id: 'Noida 6th Floor', label: 'Noida 6th', count: LOCATION_COUNTS.noida6th },
  { id: 'Noida 4th Floor', label: 'Noida 4th', count: LOCATION_COUNTS.noida4th },
  { id: 'Hyderabad Office', label: 'Hyderabad', count: LOCATION_COUNTS.hyderabad },
  { id: 'Kolkata Office', label: 'Kolkata', count: LOCATION_COUNTS.kolkata },
  { id: 'Dubai Office', label: 'Dubai', count: LOCATION_COUNTS.dubai },
  { id: 'Romania Office', label: 'Romania', count: LOCATION_COUNTS.romania },
];
