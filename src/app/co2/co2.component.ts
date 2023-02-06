
   
import { Component, OnInit } from '@angular/core';
import { registerables, Chart, ChartConfiguration, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Legend, Tooltip, ChartOptions } from 'node_modules/chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { lastValueFrom } from 'rxjs';
import { Countries } from '../countries';
import * as d3 from 'd3';
import { GoogleService } from '../google.service';

export interface FileInfo {
  countryName: string;
  checked: boolean;
  id: string;
  number: number;
}

export interface CO2Info {
  country: string;
  co2: number;
  year: number;
}

//combine data for each country
interface CountryData {
  [country: string]: {
    data: Array<{
      year: number;
      co2 : number;
    }>
  }
}

@Component({
  selector: 'app-co2',
  templateUrl: './co2.component.html',
  styleUrls: ['./co2.component.css']
})
export class CO2Component {

  fileInfo: FileInfo[] = [];
  countryName : string[] = []

  constructor(private readonly google : GoogleService) {}

  framerate: string = '';
  framerate1: string = '';
  framerate2: string = '';
  fileName: string = '';
  fileName1: string = '';
  fileName2: string = '';
  showBar = false;
  limitNumber = 2;
  true: boolean[] = [];
  false: boolean[] = [];
  info: string[] = []
  disableChecked = false;

  simplifiedCountryData : CountryData = {};


  async simplifyCSVfile(object: FileInfo) {
    const data = await lastValueFrom(this.google.getFiles(object.id));
    this.disableChecked = false;
    this.showBar = false;
    var parsed = d3.csvParse(data, d3.autoType);
    console.log(parsed);
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
    let countryData: CountryData = {};
    for (let entry of simplifiedObjectsArray) {
      let country = entry.country;
      let year = entry.year;
      let co2 = entry.co2;
    
      if (countryData[country]) {
        countryData[country].data.push({year: year, co2:co2});
      } else {
        countryData[country] = {
          data: [{year: year, co2:co2}]
        };
      }
    }
    this.simplifiedCountryData = countryData;
    
    return countryData;
  }

  //list files and list countries
  ngOnInit(): void {

    //list csv files
    this.google.listFiles().subscribe((data) => {
      const file = JSON.parse(data);
      file.files.forEach((obj: { name: any; id: any; }) => {
        var y: FileInfo = {countryName: obj.name, checked: false, id: obj.id, number: 0};
        this.fileInfo.push(y);
      });
    });


  }

  
  //after checking checkbox
  onChangeFile() {
    let chartStatus1 = Chart.getChart("myChart1");

    this.fileInfo.forEach(obj=>{
      if(obj.checked === true && chartStatus1 == undefined ) {
        obj.number =  1
        this.disableChecked = true
        this.showBar = true;
        this.getFileInfo(obj).then(res => {
          this.framerate2 = res[0]
          this.fileName2 = res[1]
        })
      }
      else//uncheck first graph
      if(obj.checked === false && obj.number === 1) {
        obj.number = 0
        if (chartStatus1 != undefined) {
          chartStatus1.destroy();
          this.showBar = false
        }
        this.framerate1 = '';
        this.fileName1 = '';
      }
    })
  }

  //simplify csv file
  async getFileInfo(object: FileInfo) {

    const data = await lastValueFrom(this.google.getFiles(object.id));
    this.disableChecked = false;
    this.showBar = false;
    var parsed = d3.csvParse(data, d3.autoType);
    console.log(parsed);
    const name = object.countryName;

    //list countries
    this.simplifyCSVfile(object).then(response => {
      this.countryName = Object.keys(response)
    })

    /*
    this.fileInfo.forEach(e=>{
      let co2 = countryData[e.name].data.find(y => y.year === e.number)?.co2;
    })
    */

    

    this.info = [];
    this.fileName = name;
    this.info.push(this.framerate);
    this.info.push(this.fileName);

    //this.makeChart(simplifiedObjectsArray);
    return this.info;
  }


  //create charts
  makeChart(perf: any[]) {

    Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, annotationPlugin, Legend, Tooltip);

    var perfData1 = perf.map(function(d) {return d.co2})
    var perfLabel = perf.map(function(d) {return d.year})

    const data = {
      labels: perfLabel,
      datasets: [
        {
          label: 'CO2',
          data: perfData1,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 2,
          borderColor: '#ff6e81',
        },
      ]
    }

    if(Chart.getChart("myChart1") == undefined) {
      var chart = new Chart('myChart1', {
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
            annotation: {
              annotations: [{
                  type:'line',
                  yMin: 33,
                  yMax: 33,
                  borderColor:'#000000',
                  borderWidth:2,
              }]
            },
        
              
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        },
      })
    }
  }
  
}
