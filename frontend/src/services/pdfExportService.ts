import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AttendanceSheet } from './attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export const pdfExportService = {
  async exportAttendanceSheet(attendanceSheet: AttendanceSheet, elementId: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found for PDF export');
      }

      // Generate canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const formattedDate = format(new Date(attendanceSheet.date), 'yyyy-MM-dd');
      const filename = `emargement-${formattedDate}-${attendanceSheet.formations?.title?.replace(/\s+/g, '-')}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Erreur lors de l\'export PDF');
    }
  },

  async exportAttendanceSheetSimple(attendanceSheet: AttendanceSheet): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const margin = 15;
      
      // Load establishment info for logo
      let establishmentLogo = '';
      let establishmentName = '';
      let moduleName = '';
      
      // Get module name from schedule_slot if available
      if (attendanceSheet.schedule_slots?.formation_modules?.title) {
        moduleName = attendanceSheet.schedule_slots.formation_modules.title;
      } else {
        // Fallback: load module from database
        const { data: slotData } = await supabase
          .from('schedule_slots')
          .select('module_id, formation_modules(title)')
          .eq('id', attendanceSheet.schedule_slot_id)
          .single();
        
        if (slotData?.formation_modules) {
          moduleName = (slotData.formation_modules as any).title || '';
        }
      }
      
      if (attendanceSheet.formation_id) {
        const { data: formationData, error: formationError } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', attendanceSheet.formation_id)
          .single();
        
        if (!formationError && formationData?.establishment_id) {
          const { data: establishmentData, error: establishmentError } = await supabase
            .from('establishments')
            .select('logo_url, name')
            .eq('id', formationData.establishment_id)
            .single();
          
          if (!establishmentError && establishmentData) {
            establishmentLogo = establishmentData.logo_url || '';
            establishmentName = establishmentData.name || '';
          }
        }
      }
      
      // Load instructor info if not present
      let instructorName = '';
      if (attendanceSheet.instructor) {
        instructorName = `${attendanceSheet.instructor.first_name || ''} ${attendanceSheet.instructor.last_name || ''}`.trim();
      }
      if (!instructorName && attendanceSheet.instructor_id) {
        const { data: instructorData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', attendanceSheet.instructor_id)
          .single();
        
        if (instructorData) {
          instructorName = `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim();
        }
      }
      if (!instructorName) {
        instructorName = 'Non assigné';
      }
      
      // Load admin signature if sheet is validated
      let adminSignatureData = '';
      if (attendanceSheet.validated_by) {
        const { data: adminSig, error } = await supabase
          .from('user_signatures')
          .select('signature_data')
          .eq('user_id', attendanceSheet.validated_by)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error && adminSig) {
          adminSignatureData = adminSig.signature_data;
        }
      }

      // Load all students assigned to the formation (using user_formation_assignments for consistency)
      // Exclude the instructor from the participants list
      let students: { id: string; first_name: string; last_name: string; email: string }[] = [];
      if (attendanceSheet.formation_id) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('user_formation_assignments')
          .select(`
            user_id,
            users!user_id(
              id,
              first_name,
              last_name,
              email,
              role
            )
          `)
          .eq('formation_id', attendanceSheet.formation_id);

        if (!assignmentsError && assignments) {
          students = (assignments as any[])
            .filter((a) => a.users)
            // Exclude instructors from the participants list (they appear in the signature section)
            .filter((a) => a.users.role !== 'Formateur' && a.user_id !== attendanceSheet.instructor_id)
            .map((a) => ({
              id: a.users.id,
              first_name: a.users.first_name || '',
              last_name: a.users.last_name || '',
              email: a.users.email || ''
            }));
        }
      }

      // Load all signatures from the database
      let signatures: any[] = [];
      try {
        const { data: signaturesData, error: signaturesError } = await supabase
          .from('attendance_signatures')
          .select(`*, users(first_name, last_name, email)`)
          .eq('attendance_sheet_id', attendanceSheet.id);

        if (!signaturesError && signaturesData) {
          signatures = (signaturesData as any[]).map(sig => ({
            ...sig,
            user: (sig as any).users
          }));
        }
      } catch (e) {
        console.error('Unexpected error loading signatures for PDF export:', e);
      }

      // Create a map of signatures by user_id
      const signatureMap = new Map<string, any>();
      signatures.forEach(sig => {
        signatureMap.set(sig.user_id, sig);
      });

      // Merge students with their signatures
      const participants = students.map(student => {
        const signature = signatureMap.get(student.id);
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          present: signature?.present ?? false,
          signed: !!signature,
          signature_data: signature?.signature_data || null,
          absence_reason: signature?.absence_reason || null
        };
      });

      // Get instructor signature
      const instructorSignature = signatures.find(sig => sig.user_type === 'instructor');
      
      // Header with purple background
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Add establishment logo and name in top-left corner
      let logoHeight = 0;
      if (establishmentLogo) {
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
            logoImg.src = establishmentLogo;
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = logoImg.width;
          canvas.height = logoImg.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(logoImg, 0, 0);
            const logoData = canvas.toDataURL('image/png');
            
            // Add white background for logo
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(margin - 2, 5, 26, 26, 3, 3, 'F');
            
            // Add logo
            pdf.addImage(logoData, 'PNG', margin, 7, 22, 22);
            logoHeight = 30;
          }
        } catch (e) {
          console.error('Error loading establishment logo:', e);
        }
      }
      
      // Add establishment name below logo
      if (establishmentName) {
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'normal');
        const nameY = establishmentLogo ? 37 : 15;
        const maxWidth = 30;
        const lines = pdf.splitTextToSize(establishmentName, maxWidth);
        pdf.text(lines, margin + 10, nameY, { align: 'center' });
      }
      
      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FEUILLE D\'ÉMARGEMENT', pageWidth / 2, 18, { align: 'center' });
      
      // Formation info
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(attendanceSheet.formations?.title || '', pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.text(`Niveau : ${attendanceSheet.formations?.level || ''}`, pageWidth / 2, 42, { align: 'center' });

      // Course details section
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const formattedDate = format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr });
      
      const detailsY = 60;
      pdf.text(`Date: ${formattedDate}`, margin, detailsY);
      pdf.text(`Heure: ${attendanceSheet.start_time.substring(0, 5)} - ${attendanceSheet.end_time.substring(0, 5)}`, 80, detailsY);
      pdf.text(`Salle: ${attendanceSheet.room || 'Non définie'}`, 160, detailsY);
      pdf.text(`Formateur: ${instructorName}`, margin, detailsY + 7);
      if (moduleName) {
        pdf.text(`Module: ${moduleName}`, 80, detailsY + 7);
      }

      // Count present and absent
      const presentCount = participants.filter(p => p.present).length;
      const absentCount = participants.filter(p => !p.present).length;

      // Participants list header
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Liste des participants (${participants.length})`, margin, detailsY + 18);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Présents: ${presentCount}`, margin, detailsY + 24);
      pdf.setTextColor(239, 68, 68);
      pdf.text(`Absents: ${absentCount}`, margin + 30, detailsY + 24);

      // Table header
      const tableStartY = detailsY + 30;
      const colWidths = [90, 50, 40]; // Nom et Prénom, Statut, Signature
      const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1]];
      
      // Header background (violet)
      pdf.setFillColor(139, 92, 246);
      pdf.rect(margin, tableStartY, pageWidth - 2 * margin, 12, 'F');
      
      // Header text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nom et Prénom', colX[0] + 3, tableStartY + 8);
      pdf.text('Statut', colX[1] + 3, tableStartY + 8);
      pdf.text('Signature', colX[2] + 3, tableStartY + 8);

      // Table content
      let currentY = tableStartY + 12;
      const rowHeight = 14;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      participants.forEach((participant, index) => {
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(249, 250, 251);
        }
        pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, 'F');

        // Draw cell borders
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(margin, currentY, colWidths[0], rowHeight);
        pdf.rect(colX[1], currentY, colWidths[1], rowHeight);
        pdf.rect(colX[2], currentY, colWidths[2], rowHeight);

        // Name
        pdf.setTextColor(0, 0, 0);
        const fullName = `${participant.first_name} ${participant.last_name}`.trim() || 'Nom inconnu';
        pdf.text(fullName, colX[0] + 3, currentY + 9);
        
        // Status with color - Absent if not signed OR if signed but not present
        if (participant.signed && participant.present) {
          pdf.setTextColor(34, 197, 94); // Green
          pdf.text('Présent', colX[1] + 3, currentY + 9);
        } else {
          pdf.setTextColor(239, 68, 68); // Red
          pdf.text('Absent', colX[1] + 3, currentY + 9);
        }
        
        // Display signature image if exists
        if (participant.signature_data) {
          try {
            pdf.addImage(
              participant.signature_data,
              'PNG',
              colX[2] + 2,
              currentY + 2,
              colWidths[2] - 4,
              rowHeight - 4,
              undefined,
              'FAST'
            );
          } catch (e) {
            pdf.setTextColor(34, 197, 94);
            pdf.text('Signé', colX[2] + 3, currentY + 9);
          }
        } else {
          pdf.setTextColor(156, 163, 175);
          pdf.text('Non signé', colX[2] + 3, currentY + 9);
        }
        
        currentY += rowHeight;
      });

      // Signature boxes
      const signatureY = currentY + 20;
      if (signatureY > 220) {
        pdf.addPage();
        currentY = 20;
      } else {
        currentY = signatureY;
      }

      // Check if this is an autonomy session (no instructor signature needed)
      const isAutonomySession = attendanceSheet.session_type === 'autonomie';

      if (!isAutonomySession) {
        // Trainer signature - only for non-autonomy sessions
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Signature du Formateur', margin, currentY);
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.3);
        pdf.rect(margin, currentY + 5, 85, 35);
        
        // Display trainer signature if exists
        if (instructorSignature?.signature_data) {
          try {
            pdf.addImage(
              instructorSignature.signature_data,
              'PNG',
              margin + 10,
              currentY + 10,
              65,
              25,
              undefined,
              'FAST'
            );
          } catch (e) {
            console.error('Error adding instructor signature:', e);
          }
        } else {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(156, 163, 175);
          pdf.text('En attente de signature', margin + 15, currentY + 25);
        }

        // Instructor name below signature box
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(instructorName, margin + 42.5, currentY + 45, { align: 'center' });
      }

      // Admin signature - position depends on whether instructor signature is shown
      const adminSignatureX = isAutonomySession ? (pageWidth / 2) - 42.5 : pageWidth - margin - 85;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Signature de l\'Administration', adminSignatureX, currentY);
      pdf.rect(adminSignatureX, currentY + 5, 85, 35);
      
      // Display admin signature if validated
      if (adminSignatureData) {
        try {
          pdf.addImage(
            adminSignatureData,
            'PNG',
            adminSignatureX + 10,
            currentY + 10,
            65,
            25,
            undefined,
            'FAST'
          );
        } catch (e) {
          console.error('Error adding admin signature:', e);
        }
      } else {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(156, 163, 175);
        pdf.text('En attente de validation', adminSignatureX + 15, currentY + 25);
      }

      // Admin label
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Administration', adminSignatureX + 42.5, currentY + 45, { align: 'center' });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      const footerY = Math.min(currentY + 55, 285);
      const generatedAt = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
      pdf.text(`Document généré le ${generatedAt} - NECTFY`, pageWidth / 2, footerY, { align: 'center' });

      // Generate filename
      const filename = `emargement-${format(new Date(attendanceSheet.date), 'yyyy-MM-dd')}-${attendanceSheet.formations?.title?.replace(/\s+/g, '-')}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Erreur lors de l\'export PDF');
    }
  },

  async exportTextBookToPDF(textBook: any, entries: any[], orientation: 'portrait' | 'landscape' = 'portrait'): Promise<void> {
    try {
      const isLandscape = orientation === 'landscape';
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      
      // Page dimensions with margins (20mm all around)
      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const headerHeight = 40;
      const footerHeight = 20;
      const contentStartY = margin + headerHeight;
      const maxContentY = pageHeight - margin - footerHeight;
      
      let currentY = contentStartY;
      let currentPage = 1;
      
      // Load establishment info
      let establishmentLogo = '';
      let establishmentName = '';
      if (textBook.formation_id) {
        const { data: formationData } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', textBook.formation_id)
          .single();
        
        if (formationData?.establishment_id) {
          const { data: establishmentData } = await supabase
            .from('establishments')
            .select('logo_url, name')
            .eq('id', formationData.establishment_id)
            .single();
          
          if (establishmentData) {
            establishmentLogo = establishmentData.logo_url || '';
            establishmentName = establishmentData.name || '';
          }
        }
      }
      
      // Pre-load instructor names to avoid async issues
      const instructorCache: Record<string, string> = {};
      for (const entry of entries) {
        if (entry.instructor_id && !instructorCache[entry.instructor_id]) {
          const { data: instructorData } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', entry.instructor_id)
            .single();
          if (instructorData) {
            instructorCache[entry.instructor_id] = `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim();
          }
        }
      }
      
      // Function to add header (logo, title, and establishment name ONLY on first page)
      const addHeader = async (pageNum: number) => {
        if (pageNum === 1) {
          // Logo ONLY on first page
          if (establishmentLogo) {
            try {
              const logoImg = new Image();
              logoImg.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
                setTimeout(reject, 3000);
                logoImg.src = establishmentLogo;
              });
              
              const canvas = document.createElement('canvas');
              canvas.width = logoImg.width;
              canvas.height = logoImg.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(logoImg, 0, 0);
                const logoData = canvas.toDataURL('image/png');
                pdf.addImage(logoData, 'PNG', margin, margin, 22, 22);
              }
            } catch (e) {
              console.error('Error loading logo:', e);
            }
          }
          
          // Establishment name below logo ONLY on first page
          if (establishmentName) {
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            const nameY = establishmentLogo ? margin + 27 : margin + 10;
            const lines = pdf.splitTextToSize(establishmentName, 35);
            pdf.text(lines, margin + 11, nameY, { align: 'center' });
          }
          
          // Title ONLY on first page
          pdf.setFontSize(16);
          pdf.setTextColor(139, 92, 246);
          pdf.setFont('helvetica', 'bold');
          const title = `Cahier de Texte - ${textBook.formations?.title || 'Formation'}`;
          pdf.text(title, pageWidth / 2, margin + 15, { align: 'center' });
          
          // Academic year ONLY on first page
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Année académique : ${textBook.academic_year || ''}`, pageWidth / 2, margin + 23, { align: 'center' });
          
          // Header separator line ONLY on first page
          pdf.setDrawColor(139, 92, 246);
          pdf.setLineWidth(0.5);
          pdf.line(margin, margin + headerHeight - 5, pageWidth - margin, margin + headerHeight - 5);
        }
        // Pages after first page: no header, content starts higher
      };
      
      // Function to add footer on each page
      const addFooter = (pageNum: number) => {
        const footerY = pageHeight - margin;
        
        // Separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'normal');
        
        const generatedAt = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
        pdf.text(`Document généré le ${generatedAt}`, margin, footerY - 5);
        pdf.text(establishmentName, pageWidth / 2, footerY - 5, { align: 'center' });
        pdf.text(`Page ${pageNum}`, pageWidth - margin, footerY - 5, { align: 'right' });
        
        // App mention
        pdf.setFontSize(7);
        pdf.text('Document généré automatiquement depuis NECTFY', pageWidth / 2, footerY, { align: 'center' });
      };
      
      // Function to handle page break - returns new Y position
      // Pages after first start content higher since no header
      const handlePageBreak = async (neededHeight: number): Promise<number> => {
        if (currentY + neededHeight > maxContentY) {
          addFooter(currentPage);
          pdf.addPage();
          currentPage++;
          await addHeader(currentPage);
          // No header on subsequent pages, start content at margin
          return margin + 5;
        }
        return currentY;
      };
      
      // Function to strip email addresses from text
      const stripEmails = (text: string): string => {
        // Remove email patterns like "email@domain.com Name" or just "email@domain.com"
        return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*[A-Za-zÀ-ÿ]*/g, '').trim();
      };
      
      // Function to render plain text from HTML (simplified, no async issues)
      // IMPORTANT: entry.content may sometimes be plain text (no <p>), so we enforce
      // a consistent top padding to prevent overlap with the section header.
      const renderContent = (html: string, startY: number, maxWidth: number): number => {
        if (!html || html.trim() === '' || html === '<p></p>') return startY;
        
        // Strip emails from HTML content
        html = stripEmails(html);

        // Always add a bit of breathing room before first rendered line
        let y = startY + 2;

        // Clean HTML and extract text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const ensurePageSpace = (needed: number) => {
          if (y + needed > maxContentY) {
            addFooter(currentPage);
            pdf.addPage();
            currentPage++;
            // No header on subsequent pages, start content at margin
            y = margin + 7;
          }
        };

        const processElement = (element: Element | ChildNode, indent: number = 0): void => {
          if (element.nodeType === Node.TEXT_NODE) {
            const text = element.textContent?.replace(/\s+/g, ' ').trim();
            if (text) {
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10);
              pdf.setTextColor(60, 60, 60);

              const lines = pdf.splitTextToSize(text, maxWidth - indent - 6);
              for (const line of lines) {
                ensurePageSpace(6);
                pdf.text(line, margin + 5 + indent, y);
                y += 5;
              }
            }
          } else if (element.nodeType === Node.ELEMENT_NODE) {
            const el = element as HTMLElement;
            const tagName = el.tagName.toLowerCase();

            // Pre spacing for common blocks
            if (tagName === 'p' || tagName === 'div') {
              y += 2;
            } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
              y += 4;
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(tagName === 'h1' ? 14 : tagName === 'h2' ? 12 : 11);
            } else if (tagName === 'br') {
              y += 4;
              return;
            } else if (tagName === 'ul' || tagName === 'ol') {
              y += 2;
            } else if (tagName === 'li') {
              const bullet = el.parentElement?.tagName.toLowerCase() === 'ol'
                ? `${Array.from(el.parentElement.children).indexOf(el) + 1}. `
                : '• ';
              const text = el.textContent?.replace(/\s+/g, ' ').trim();
              if (text) {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.setTextColor(60, 60, 60);

                const lines = pdf.splitTextToSize(bullet + text, maxWidth - 15);
                for (const line of lines) {
                  ensurePageSpace(6);
                  pdf.text(line, margin + 10, y);
                  y += 5;
                }
              }
              return; // Don't process children for li
            } else if (tagName === 'strong' || tagName === 'b') {
              pdf.setFont('helvetica', 'bold');
            } else if (tagName === 'em' || tagName === 'i') {
              pdf.setFont('helvetica', 'italic');
            }

            // Process children
            for (const child of Array.from(el.childNodes)) {
              processElement(child, indent);
            }

            // Reset after block elements
            if (['p', 'div', 'h1', 'h2', 'h3', 'ul', 'ol'].includes(tagName)) {
              y += 3;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10);
            }
          }
        };

        for (const child of Array.from(tempDiv.childNodes)) {
          processElement(child);
        }

        return y;
      };
      
      // Add first page header
      await addHeader(1);
      
      // Sort entries by date
      const sortedEntries = [...entries].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.start_time.localeCompare(b.start_time);
      });
      
      if (sortedEntries.length === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Aucune entrée dans ce cahier de texte.', pageWidth / 2, currentY + 20, { align: 'center' });
      } else {
        // Render each entry
        for (let i = 0; i < sortedEntries.length; i++) {
          const entry = sortedEntries[i];
          
          // Check if we need a page break for entry header
          currentY = await handlePageBreak(40);
          
          // Entry header background
          pdf.setFillColor(139, 92, 246);
          pdf.rect(margin, currentY, contentWidth, 8, 'F');
          
          // Entry header columns
          const colWidths = isLandscape 
            ? [50, 45, 85, 77]
            : [40, 35, 55, 40];
          const colX = [
            margin,
            margin + colWidths[0],
            margin + colWidths[0] + colWidths[1],
            margin + colWidths[0] + colWidths[1] + colWidths[2]
          ];
          
          pdf.setFontSize(9);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.text('DATE', colX[0] + 3, currentY + 5.5);
          pdf.text('HEURE', colX[1] + 3, currentY + 5.5);
          pdf.text('MATIÈRE/MODULE', colX[2] + 3, currentY + 5.5);
          pdf.text('FORMATEUR', colX[3] + 3, currentY + 5.5);
          
          currentY += 8;
          
          // Entry data row
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, currentY, contentWidth, 10, 'F');
          
          // Draw cell borders
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(0.2);
          for (let j = 0; j < 4; j++) {
            pdf.rect(colX[j], currentY, colWidths[j], 10);
          }
          
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          pdf.setFont('helvetica', 'normal');
          
          const formattedDate = format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr });
          const timeRange = `${entry.start_time.substring(0, 5)} - ${entry.end_time.substring(0, 5)}`;
          
          pdf.text(formattedDate, colX[0] + 3, currentY + 6.5);
          pdf.text(timeRange, colX[1] + 3, currentY + 6.5);
          
          // Subject matter
          const subjectText = entry.subject_matter || '';
          const maxSubjectLen = isLandscape ? 40 : 25;
          const truncatedSubject = subjectText.length > maxSubjectLen 
            ? subjectText.substring(0, maxSubjectLen - 3) + '...'
            : subjectText;
          pdf.text(truncatedSubject, colX[2] + 3, currentY + 6.5);
          
          // Instructor name from cache
          const instructorName = entry.instructor_id ? (instructorCache[entry.instructor_id] || 'N/A') : 'N/A';
          const maxInstructorLen = isLandscape ? 35 : 18;
          const truncatedInstructor = instructorName.length > maxInstructorLen 
            ? instructorName.substring(0, maxInstructorLen - 3) + '...'
            : instructorName;
          pdf.text(truncatedInstructor, colX[3] + 3, currentY + 6.5);
          
          currentY += 12;
          
          // Content section if exists
          if (entry.content && entry.content.trim() !== '' && entry.content !== '<p></p>') {
            // Reserve enough space for the header band + first lines
            currentY = await handlePageBreak(22);

            // Content header (taller band to avoid baseline overlap)
            const contentHeaderH = 7;
            pdf.setFillColor(243, 232, 255);
            pdf.rect(margin, currentY, contentWidth, contentHeaderH, 'F');

            pdf.setFontSize(8);
            pdf.setTextColor(139, 92, 246);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CONTENU DE LA SÉANCE', margin + 3, currentY + 4.8);

            // Space between the header band and the content block
            currentY += contentHeaderH + 4;

            // Render content (renderContent already adds a small top padding)
            currentY = renderContent(entry.content, currentY, contentWidth);
            currentY += 6;
          }
          
          // Files section if exists
          if (entry.files && entry.files.length > 0) {
            currentY = await handlePageBreak(20);
            
            pdf.setFillColor(239, 246, 255);
            pdf.rect(margin, currentY, contentWidth, 6, 'F');
            
            pdf.setFontSize(8);
            pdf.setTextColor(59, 130, 246);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PIÈCES JOINTES', margin + 3, currentY + 4);
            
            currentY += 8;
            
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            pdf.setFont('helvetica', 'normal');
            
            for (const file of entry.files) {
              currentY = await handlePageBreak(8);
              
              const fileName = file.file_name || 'Document';
              const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';
              
              pdf.setFillColor(220, 220, 220);
              pdf.roundedRect(margin + 3, currentY - 3, 12, 5, 1, 1, 'F');
              pdf.setFontSize(6);
              pdf.setTextColor(100, 100, 100);
              pdf.text(fileExt.substring(0, 4), margin + 4, currentY);
              
              pdf.setFontSize(9);
              pdf.setTextColor(60, 60, 60);
              pdf.text(`${fileName} - Document joint à la séance`, margin + 18, currentY);
              
              currentY += 7;
            }
            
            currentY += 3;
          }
          
          // Spacing between entries
          currentY += 10;
          
          // Separator line between entries
          if (i < sortedEntries.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.1);
            pdf.line(margin + 20, currentY - 5, pageWidth - margin - 20, currentY - 5);
          }
        }
      }
      
      // Add footer to the last page
      addFooter(currentPage);
      
      // Generate filename
      const formationTitle = textBook.formations?.title?.replace(/\s+/g, '-') || 'formation';
      const filename = `cahier-texte-${formationTitle}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting text book PDF:', error);
      throw new Error('Erreur lors de l\'export PDF du cahier de texte');
    }
  }
};