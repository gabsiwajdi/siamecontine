import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';

//** import pdf maker */
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
})
export class ConfigurationComponent implements OnInit {
  currentDate = '';
  employees: any[] = [];
  monthlyData: any[] = [];

  constructor() {
    const now = new Date();
    this.currentDate = now.toISOString().split('T')[0];
    this.loadEmployeesFromLocalStorage();
  }

  ngOnInit(): void {}

  saveEmployeesToLocalStorage() {
    localStorage.setItem('employees', JSON.stringify(this.employees)); // Enregistrer les employés dans le localStorage
  }

  loadEmployeesFromLocalStorage() {
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
      this.employees = JSON.parse(storedEmployees); // Charger les employés depuis le localStorage
    }
  }
  // Méthode appelée lors de la sélection d'un fichier
  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    // Vérifier le type de fichier
    if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
      const reader: FileReader = new FileReader();

      reader.onload = (e: any) => {
        const data: string = e.target.result;
        const lines: string[] = data.split('\n'); // Séparation des lignes

        // Vérifier l'entête du fichier
        const header: string = lines[0];
        const expectedHeader: string = 'nom;code;autorisation';

        if (header.trim() === expectedHeader) {
          // Réinitialiser la liste des employés
          this.employees = [];

          // Boucler à travers les lignes pour récupérer les données
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const cols: string[] = line.split(';'); // Séparation des colonnes

            if (cols.length >= 3) {
              const employee = {
                nom: cols[0].trim(),
                code: cols[1].trim(),
                autorisation: cols[2].trim(),
              };
              this.employees.push(employee); // Ajouter l'employé à la liste
            }
          }

          // Enregistrer les employés dans le localStorage
          this.saveEmployeesToLocalStorage();

          // Afficher une fenêtre modale de succès
          Swal.fire({
            icon: 'success',
            title: 'Fichier valide',
            text: 'Les données ont été chargées avec succès.',
          });

          // Afficher un message si les données ont été chargées avec succès
          console.log('Données chargées avec succès:', this.employees);
        } else {
          // Afficher une fenêtre modale d'erreur si l'entête du fichier n'est pas valide
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "L'entête du fichier n'est pas valide.",
            timer: 1000,
          });

          // Afficher un message d'erreur si l'entête du fichier n'est pas valide
          console.error('Erreur: Entête du fichier non valide.');
        }
      };

      reader.readAsText(file); // Lecture du fichier texte
    } else {
      // Afficher une fenêtre modale d'erreur si le type de fichier n'est pas pris en charge
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Type de fichier non pris en charge.',
        timer: 1000,
      });

      // Afficher un message d'erreur si le type de fichier n'est pas pris en charge
      console.error('Erreur: Type de fichier non pris en charge.');
    }
  }
  // Méthode pour générer le rapport PDF

  async generateRapportPDF() {
    const currentMonth = new Date().getMonth() + 1;
    const daysInMonth = new Date(
      new Date().getFullYear(),
      currentMonth,
      0
    ).getDate();
    const accessMatrix = [];
    const dateHeaders = Array.from({ length: daysInMonth }, (_, i) =>
      (i + 1).toString()
    );
    accessMatrix.push(['Employé', ...dateHeaders, 'NJ']);

    this.employees.forEach((employee: any) => {
      const employeeRow = [employee.nom];
      let totalDaysAccessed = 0;

      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(
          new Date().getFullYear(),
          currentMonth - 1,
          i
        ).toLocaleDateString();
        const storedCodes = localStorage.getItem(currentDate);
        if (storedCodes) {
          const usedCodes = JSON.parse(storedCodes);
          const hasAccess = usedCodes.includes(employee.code);
          employeeRow.push(hasAccess ? '*' : '');
          if (hasAccess) totalDaysAccessed++;
        } else {
          employeeRow.push('');
        }
      }
      employeeRow.push(totalDaysAccessed.toString());
      accessMatrix.push(employeeRow);
    });

    const currentYear = new Date().getFullYear();
    const monthNames = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    const currentMonthName = monthNames[currentMonth - 1];
    const currentDate = new Date().toLocaleDateString('fr-FR');

    const documentDefinition = {
      content: [
        // Logo
        {
          image: await this.getBase64ImageFromURL(
            '../../assets/images/logo.png'
          ),
          width: 160, // Augmenter la taille du logo
          height: 80, // Augmenter la taille du logo
          alignment: 'left',
          margin: [0, 0, 0, 0], // Marges nulles pour éliminer l'espace
        },
        // Titre
        {
          text: 'Rapport Contine',
          style: 'header',
          alignment: 'center',
          color: 'blue', // Mettre le titre en bleu
          margin: [0, -20, 0, 10], // Ajouter des marges au titre et le déplacer vers le haut
        },
        // Mois et année
        {
          text: `Mois : ${currentMonthName} ${currentYear}`,
          alignment: 'center',

          margin: [0, 0, 0, 5], // Ajouter des marges au mois
        },
        {
          text: `Date : ${currentDate}`,
          alignment: 'center',

          margin: [0, 0, 0, 20], // Ajouter des marges à la date
        },
        // Saut de ligne
        { text: '\n\n' },
        // Tableau des données
        {
          table: {
            headerRows: 1,
            widths: Array(accessMatrix[0].length).fill('auto'),
            body: accessMatrix,
            pageBreak: 'auto',
          },
        },
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          decoration: 'underline', // Ajouter un soulignement au titre
        },
      },
      pageOrientation: 'landscape',
    };

    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    const pdfDoc = pdfMake.createPdf(documentDefinition);
    
    pdfDoc.getDataUrl((dataUrl: string) => {
      const pdfWindow = window.open();
      pdfWindow?.document.write(
        '<iframe width="100%" height="100%" src="' +
          dataUrl +
          '" frameborder="0"></iframe>'
      );
    });
   // pdfDoc.download('rapport_acces_employes.pdf'); 
  }

  getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject(new Error("Impossible d'obtenir le contexte 2D du canevas."));
        }
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = url;
    });
  }
}
