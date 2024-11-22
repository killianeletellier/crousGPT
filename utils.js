const parser = require('xml2json');
const { html2json } = require('html2json');
const axios = require('axios');

exports.getRestaurantMenu = async (restaurantID) => {
    console.log(`[UTILS] Fetching menu for restaurant ${restaurantID}`);

    const date = new Date().toISOString().slice(0, 10);

    try {
        const response = await axios.get('http://webservices-v2.crous-mobile.fr:8080/feed/lille/externe/menu.xml');
        const json = JSON.parse(parser.toJson(response.data)).root.resto;

        const restaurant = json.find(restaurant => restaurant.id === restaurantID);
        const menu = restaurant.menu;
        
        const todayMenu = menu.date ? menu : menu.find(day => day.date === date);
        const jsonMenu = todayMenu ? html2json(todayMenu.$t).child.splice(1) : [];
        const meals = jsonMenu.filter(node => node.tag === 'ul').flatMap(node => node.child.map(meal => meal.child[0].text));

        return meals;
    } catch (error) {
        return error;
    }
}

exports.sendNotification = async (json) => {
    console.log(`[UTILS] Sending notification`);

    try {
        const formattedBenefits = json.benefits.map(benefit => `\n\t- ${benefit}`).join('');
        const formattedDrawbacks = json.drawbacks.map(drawback => `\n\t- ${drawback}`).join('');

        await axios.post(`https://ntfy.sh/${process.env.NTFY_TOPIC_NAME}`, `Avantages :${formattedBenefits}\n\nInconvénients :${formattedDrawbacks}`, {
            headers: {
                'Title': `Restaurant du jour : ${json.finalChoice}`
            }
        })
    } catch (error) {
        return error;
    }
}