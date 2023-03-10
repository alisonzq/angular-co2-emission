import { Component, OnInit } from '@angular/core';
import { registerables, Chart, ChartConfiguration, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Legend, Tooltip, ChartOptions } from 'node_modules/chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { lastValueFrom } from 'rxjs';
import * as d3 from 'd3';
import { GoogleService } from '../google.service';
import {continentData} from '../country-by-continent';

export interface FileInfo {
  fileName: string;
  checked: boolean;
  id: string;
  number: number;
}

export interface CO2Info {
  country: string;
  co2: number;
  year: number;
}

interface CountryData {
  country: string;
  data: Array<{
    year: number;
    co2: number;
  }>;
  checked: boolean;
}

interface ContinentInfo {
  continent: string;
  countryData: Array<CountryData>;
}


@Component({
  selector: 'app-co2',
  templateUrl: './co2.component.html',
  styleUrls: ['./co2.component.css']
})
export class CO2Component {

  fileInfo: FileInfo[] = [];
  countryCheck: boolean = false;

  private dataLoaded = false;

  constructor(private readonly google : GoogleService) {}

  countryName: string = '';
  showBar = false;
  limitNumber = 2;
  true: boolean[] = [];
  false: boolean[] = [];
  info: string[] = []
  disableChecked = false;

  sortedByContinent : ContinentInfo[] = [];
  simplifiedCountryData : CountryData[] = [];
  currentContinent: string = "";


  async simplifyCSVfile(object: FileInfo) {
    const data = await lastValueFrom(this.google.getFiles(object.id));
    this.disableChecked = false;
    this.showBar = false;
    var parsed = d3.csvParse(data, d3.autoType);
    const simplifiedObjectsArray: CO2Info[] = [];

    //simplifies the data in csv (country, co2 & year) into simplifiedObjectsArray
    parsed.forEach((obj)=> {
      var objectEntries = Object.entries(obj);
      var country = '';
      var co2: any, year = 0;
      objectEntries.forEach( entry => {
        if(entry[0].includes("country")){
          country = entry[1]
        } else if(entry[0]=="co2") {
          co2=entry[1];
        } else if(entry[0] == "year") {
          year = entry[1];
        }
      });
      var y: CO2Info = {country : country, co2: co2, year: year}
      simplifiedObjectsArray.push(y);
    })

    //combine data
    let countryData: Array<CountryData> = [];
    for (let entry of simplifiedObjectsArray) {
      let country = entry.country;
      let year = entry.year;
      let co2 = entry.co2;
    
      let countryExists = false;
      for (const data of countryData) {
        if (data.country === country) {
          data.data.push({ year, co2 });
          countryExists = true;
          break;
        }
      }
      if (!countryExists) {
        countryData.push({
          country,
          data: [{ year, co2 }],
          checked: false
        });
      }
    }
    return countryData;
  }

  sortByContinent(countryData: CountryData[]) {
    let continentInfo: Array<ContinentInfo> = [];
    countryData.forEach(country => {
      continentData.forEach((e: any) => {
        if (country.country == e.country) {
          let continent = e.continent as string;

          let continentExists = continentInfo.find(c => c.continent == continent);
          if (continentExists) {
            // If continent exists, push the country object into the country array
            continentExists.countryData.push(country);
          } else {
            // If continent doesn't exist, create a new object with the continent and country array
            let newContinent = {
              continent: continent,
              countryData: [country]
            };
            continentInfo.push(newContinent);
          }
        }
      });
    });
    return continentInfo;
  }

  //list files and list countries
  ngOnInit(): void {
    //list csv files
    this.google.listFiles().subscribe((data) => {
      const file = JSON.parse(data);
      file.files.forEach((obj: { name: any; id: any; }) => {
        var y: FileInfo = {fileName: obj.name, checked: false, id: obj.id, number: 0};
        this.fileInfo.push(y);
      });
    });

    //this.onSelectFile();
  }

  //list countries
  onSelectFile() {
    if (!this.dataLoaded) {
      this.fileInfo.forEach(obj=>{
          this.disableChecked = true
          this.showBar = true;
  
          this.simplifyCSVfile(obj).then(response => {
            this.simplifiedCountryData = response;
            this.sortedByContinent = this.sortByContinent(response);
          })
      })
      this.dataLoaded = true;
    }
  }

  //after checking country checkbox
  onChangeFile(country: {country: string; data: any[]; checked: any;}) {
    let chartStatus1 = Chart.getChart("myChart1");
    

    if(country.checked === true) {
      this.countryName = country.country;
      this.disableChecked = true;
      this.makeChart(country.data);
    }
    else//uncheck first graph
    if(country.checked === false ) {
      if (chartStatus1 != undefined) {
        chartStatus1.destroy();
      }
      this.countryName = '';
    }
  }

  //create charts
  makeChart(perf: any[]) {

    var countryLabel: string = '';
    this.simplifiedCountryData.forEach(e=>{
      if(e.checked === true) {
        countryLabel = e.country;
      }
    })
  
    Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, annotationPlugin, Legend, Tooltip);
  
    var perfData1 = perf.map(function(d) {return d.co2});
    var perfLabel = perf.map(function(d) {return d.year})
  
    const data = {
      labels: perfLabel,
      datasets: [
        {
          label: countryLabel,
          data: perfData1,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 2,
          borderColor: '#ff6e81',
        },
      ]
    }
  
    var chart;
    if(Chart.getChart("myChart1") == undefined) {
      chart = new Chart('myChart1', {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'line',
              }
            },
  
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        },
      })
    } else {
      chart = Chart.getChart("myChart1");
      if(chart) {
        chart.data.datasets.push({
          label: countryLabel,
          data: perfData1,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 2,
          borderColor: '#42a7f5',
        });
        chart.update();
      }
    }
  }
  
}
