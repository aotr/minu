# Minu (Markup Injection and Network Utility)

Minu is a lightweight, dependency-free JavaScript library aimed at enhancing web applications by allowing dynamic injection of markup into web pages and facilitating network interactions. Designed for ease of use and straightforward integration, Minu is an ideal solution for developers looking to extend the functionality of both new and existing web projects without the overhead associated with larger frameworks.

## Key Features

### Dynamic Markup Injection
Minu enables developers to dynamically update the DOM with new content, providing real-time enhancements to the user interface without the need for page reloads. This feature is particularly valuable for single-page applications (SPAs) and any web interface that requires dynamic content updates.

### Efficient Network Interactions
With built-in functionalities for making HTTP requests and handling responses, Minu simplifies the process of fetching data from servers, submitting form data, and interacting with RESTful APIs. This capability is crucial for building interactive, data-driven web applications.

### Custom Event Dispatching
Minu offers a streamlined approach to triggering and managing custom browser events, allowing developers to create more interactive and responsive web applications by responding to user actions or changes in data in real-time.

## Usage Scenario

Minu is especially useful in scenarios where developers need to rapidly prototype web applications, implement AJAX-based content loading, or require a minimalistic library to enhance the functionality of existing projects. By integrating Minu, developers can significantly improve web application interactivity, user experience, and the overall development process of modern, high-performance web applications.

## How to Use Minu

To get started with Minu, include the library in your project and initialize it by calling the `init` method with a selector to target elements that should dynamically load content:

```html
<script src="path/to/minu.js"></script>
<script>
    minu.init('[minu-get]');
</script>
```

Define elements in your HTML that should fetch and display content dynamically:

```html
<span minu-get="/path/to/data" minu-trigger="load">
    <span minu-loader>Loading...</span>
    <div minu-content>
        <!-- Dynamic content will be loaded here -->
        $0.00
    </div>
</span>
```

Minu will automatically handle content loading when the page loads or when the specified trigger event occurs. The loader will be displayed while fetching content and hidden once the content is successfully loaded.

## Customization and Advanced Usage

Minu's behavior can be customized further by defining additional handlers and leveraging the library's flexible architecture to suit specific project needs. For advanced usage scenarios, including custom event handling and dynamic content updates based on user interaction, refer to the documentation and examples provided in the Minu repository.

## Contributing

Contributions to Minu are welcome! Whether it's reporting issues, submitting fixes, or proposing new features, we appreciate your input and encourage collaboration to make Minu even better.