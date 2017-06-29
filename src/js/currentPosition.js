'use strict';
( function ($) {

$.fn.selectPolygon = function () {
  
  let map=null,
      infoWindow,
      draw = true, // рисуем полигон, при добавлении новых точек на карту
      path = null,
      polyline,
      polygon,
      index = 0, // для идентификации полигонов в слое данных
      focusPolygon = 0, // отвечает за фокусировку полигона
      geoJson,
      addpolygon,
      deletepolygon,
      deleteall,
      exportpolygon,
      importpolygon;
      
  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
      'Error: The Geolocation service failed.' :
      'Error: Your browser doesn\'t support geolocation.');
  }
  
  function addPolyline(event, map) {
    path = polyline.getPath();
    path.push(event.latLng);
    polyline.setMap(map); 
  }
  
  // проверяем полигон на выпуклость - определяем форму многоугольника
  function definePolygonShape (path) {
    //вычисляем площадь будущего полигона
    let area = google.maps.geometry.spherical.computeArea(path);
  
    let length = path.getLength(); // количество точек, из которых состоит полигон
    let newLength = 0; // количество точек, которые будут удовлетворять условию выпуклости полигона
  
    for (let i = 0; i < length; i++) {
      // обнуляем значение переменной newPath чтобы в следующей раз снова получить точную копию переменной path
      let newPath = new google.maps.MVCArray();
      //сoздаём копию массива координат будущего полигона
      path.forEach( function(latLng) {
        newPath.push(latLng);
      });
    
      // удаляем координаты одной из точек чтобы получить новый полигон с меньшей площадью, чем у исходного полигона В ТОМ СЛУЧАЕ ЕСЛИ ОН ЯВЛЯЕТСЯ ВЫПУКЛЫМ
      newPath.removeAt(i);
      let newArea = google.maps.geometry.spherical.computeArea(newPath);
    
      if(area > newArea) {
        newLength +=1;
      } 
    } // end for
  
    //если все точки полигона прошли проверку на выпуклость
    if(length === newLength) {
      console.log('полигон выпуклый');
      polygon.setPath(path);
      return true;
    } else {
      removeFigure(polyline);
      infoWindow.setContent('Полигон должен быть выпуклым! Начните всё сначала!');
      map.panTo(infoWindow.getPosition());
      infoWindow.open(map);
      return false;
    }
  } // end function definePolygonShape
  
  function removeFigure(shape) {
    let path = [];
    shape.setMap(null);
    shape.setPath(path);
  }
  
  function addPolygon() {
    let path = polyline.getPath();  
    polygon.setPath(path);
    removeFigure(polyline);
  }
  
  function savePolygon() {
    index +=1;
    let feature = new google.maps.Data.Feature({
      id: index,
      geometry: new google.maps.Data.Polygon([polygon.getPath().getArray()])
    });
    map.data.add(feature);
    removeFigure(polygon);
  }
  
  function drawPolygon() {
    if (draw) {
      console.log('рисуем полилинию');
      draw = !draw; // для того, чтобы при повторном нажатии кнопки "Add Polygon" вместо полилинии нарисовался полигон
      map.addListener('click', function(e) {
        map.panTo(e.latLng); // для удобства, можно и не делать
        addPolyline(e, map);
      }); 
    } else  {
        console.log('рисуем полигон');
        google.maps.event.clearListeners(map, 'click');
     
        let resultСalculation = definePolygonShape(path);
        if(resultСalculation) { 
          // если будущий полигон по форме выпуклый
          addPolygon();
          savePolygon();
        }
        draw = !draw; // снова добавляем возможность рисования полилинии
      }
  }
  
  function deletePolygon() {
    map.data.forEach(function(feature) {
      let index = feature.getId();
      // если этот полигон подсвечен
      if( index == focusPolygon ) {
        focusPolygon = 0; // убираем подсвечивание
        map.data.remove(feature);
      }
    });
  }
  
  function deleteAll() {
    map.data.forEach(function (feature) {
      focusPolygon = 0; // убираем подсвечивание
      map.data.remove(feature);
    });
  }
  
  function exportPolygon() {
    // инициализация данных в формате GeoJSON
    geoJson = {
      "type": "FeatureCollection",
      "features": []
    };
    let polygonFeature = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": []
      }
    };
    
    map.data.forEach(function(feature) {
      // временное хранилище массива координат
      let arrayCoordinates = [];
    
      feature.getGeometry().forEachLatLng(
        function (latLng) {
          arrayCoordinates.push([latLng.lng(), latLng.lat()]);
        }
      );
      polygonFeature.geometry.coordinates = arrayCoordinates;
      geoJson.features.push(polygonFeature);
    });
  
    map.data.toGeoJson(function(geoJson) {
      let geojson = JSON.stringify(geoJson);
      // экспорт geoJSON данных на главную страницу index.html
      //window.opener.document.getElementById('geoJSON').value = JSON.stringify(geoJson);
      // экспорт geoJSON данных на страницу currentPosition.html
      document.getElementById('geoJSON').value = geojson;
      // сохраняем данные, чтобы их в последствии можно было снова загрузить в виджет
      localStorage.setItem('polygon', geojson);
    });
  } // end function exportPolygon
  
  function importPolygon() {
    // извлекаем данные, которые были ранее экспортированны,  из хранилища
    let polygon = localStorage.getItem('polygon');
    // размещаем ранее сохранённые данные на карте
    map.data.addGeoJson(JSON.parse(polygon));
  }
  
  
  // реализация процедуры инициализации  
  navigator.geolocation.getCurrentPosition(function(position) {
    let pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
      
    let latLng = new google.maps.LatLng(pos.lat, pos.lng);
      
    let mapOptions = {
      center: latLng,
      zoom: 16,
      scrollwheel: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
        
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
    // создаём новый слой данных
    map.panTodata = new google.maps.Data();
      
    // устанавливаем стили для слоя
    map.data.setStyle({
      strokeColor: '#000',
      strokeWeight: 2,
      fillOpacity: 0.55,
      clickable: true,
      draggable: true
    });
      
    // добавляем слой данных на карту
    map.data.setMap(map);
      
    polyline = new google.maps.Polyline({
      strokeColor: '#000',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
        
    polygon = new google.maps.Polygon({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FF0000',
      fillOpacity: 0.55,
      map: map,
      draggable: true
    }); 
    
    // при клике на полигон - он подсвечивается
    google.maps.event.addListener(map.data, 'click', function(event) {

      let id = event.feature.getId(); // находим полигон, по которому кликнули
        
      if( id == focusPolygon ) {
        // если кликнули по полигону, который уже подсвечен
        map.data.overrideStyle(event.feature, {fillOpacity: 0.55});
        focusPolygon = 0;
      } else if (id != focusPolygon && focusPolygon == 0) {
        // подсвечивам полигон
        map.data.overrideStyle(event.feature, {fillOpacity: 0.15});
        focusPolygon = id;
      } else {
        // убираем подсветку полигона
        map.data.overrideStyle(event.feature, {fillOpacity: 0.55});
      }
    });
    
    addpolygon = document.getElementById('addPolygon');
    google.maps.event.addDomListener(addpolygon, 'click', drawPolygon);
    
    deletepolygon = document.getElementById('deletePolygon');
    google.maps.event.addDomListener(deletepolygon, 'click', deletePolygon);
    
    deleteall = document.getElementById('deleteAll');
    google.maps.event.addDomListener(deleteall, 'click', deleteAll);
    
    exportpolygon = document.getElementById('export');
    google.maps.event.addDomListener(exportpolygon, 'click', exportPolygon);
    
    importpolygon = document.getElementById('import');
    google.maps.event.addDomListener(importpolygon, 'click', importPolygon);
    
    infoWindow = new google.maps.InfoWindow({
      content: "",
      position: latLng
    });
      
  }, function() {
       handleLocationError(true, infoWindow, map.getCenter());
     }
  ); // end navigator.geolocation.getCurrentPosition
  
} // end function selectPolygon

})(jQuery);