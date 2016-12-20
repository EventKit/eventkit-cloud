import openlayers from 'openlayers'

export default class DrawControl extends openlayers.control.Control {
    constructor(className) {
        const element = document.createElement('div')
        super({element})
        element.className = `${className || ''} ol-unselectable ol-control`
        element.title = 'Click to draw a bounding box'
        element.style.backgroundColor === 'rgb(22, 117, 170)'
        element.color = 'white'
        element.innerHTML = '<span style="width:80px"><i class="fa fa-plus fa-1x">  DRAW</i></span>'
        const hyperlink = this.element
        hyperlink.addEventListener('click',  function() {
            console.log("the button was clicked!")
            //TODO: change the cursor to the cross to allow user to select BBOX
        });


    }
   


}