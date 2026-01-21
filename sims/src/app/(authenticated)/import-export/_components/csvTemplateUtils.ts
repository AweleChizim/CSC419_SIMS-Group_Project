/**
 * CSV Template Utilities
 * 
 * Functions to generate and download CSV templates for import operations
 */

/**
 * Download a CSV template file
 */
export function downloadCSVTemplate(headers: string[], filename: string, exampleRows?: string[][]) {
  // Create CSV content
  const rows: string[] = [headers.join(',')];
  
  // Add example rows if provided
  if (exampleRows && exampleRows.length > 0) {
    exampleRows.forEach((row) => {
      // Escape values that contain commas or quotes
      const escapedRow = row.map((value) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      rows.push(escapedRow.join(','));
    });
  }

  const csvContent = rows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download student import template
 */
export function downloadStudentTemplate() {
  const headers = [
    'email',
    'firstName',
    'middleName',
    'lastName',
    'studentNumber',
    'admissionYear',
    'level',
    'status',
    'academicStanding',
  ];

  const exampleRows = [
    [
      'john.doe@example.com',
      'John',
      'Michael',
      'Doe',
      'STU2024001',
      '2024',
      '100',
      'active',
      'First Class',
    ],
    [
      'jane.smith@example.com',
      'Jane',
      '',
      'Smith',
      'STU2024002',
      '2024',
      '200',
      'active',
      '',
    ],
  ];

  downloadCSVTemplate(headers, 'student_import_template.csv', exampleRows);
}

/**
 * Generate and download course import template
 */
export function downloadCourseTemplate() {
  const headers = [
    'code',
    'title',
    'description',
    'credits',
    'level',
    'status',
    'prerequisites',
    'programIds',
  ];

  const exampleRows = [
    [
      'CSC101',
      'Introduction to Computer Science',
      'An introductory course covering basic programming concepts',
      '3',
      '100',
      'C',
      'CSC100',
      '',
    ],
    [
      'CSC201',
      'Data Structures',
      'Study of fundamental data structures and algorithms',
      '3',
      '200',
      'R',
      'CSC101,CSC102',
      '',
    ],
    [
      'CSC301',
      'Advanced Algorithms',
      'Advanced topics in algorithm design and analysis',
      '3',
      '300',
      'E',
      '',
      '',
    ],
  ];

  downloadCSVTemplate(headers, 'course_import_template.csv', exampleRows);
}

/**
 * Generate and download enrollment import template
 */
export function downloadEnrollmentTemplate() {
  const headers = ['studentNumber', 'studentId', 'status', 'grade', 'term'];

  const exampleRows = [
    ['STU2024001', '', 'enrolled', '', 'Fall 2024'],
    ['STU2024002', '', 'active', '', 'Fall 2024'],
    ['', 'student_id_here', 'enrolled', 'A', 'Fall 2024'],
  ];

  downloadCSVTemplate(headers, 'enrollment_import_template.csv', exampleRows);
}

